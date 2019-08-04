//Token
const token = '862988372:AAHBh0X5NssHnaJ7eQF3CNCNSVFzkgU5ivM';
//Telegram bot, Mongo and Emoji
const TelegramBot = require('node-telegram-bot-api');
const emoji = require('node-emoji');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

//Created Bot
const bot = new TelegramBot(token, {polling: true});

//OPT for Bold italic text 
const opts = {
    parse_mode: 'Markdown',
}
//Hitap
let hitap = "efendim";

let today = new Date();
const dateVal = {
    time: today.getTime(),
    day: today.getDay(),
    month: today.getMonth(),
    year: today.getFullYear(),
}
let currentMoney = "TL";
let testVersion = false;
const isToday = (someDate) => {
    someDate = new Date(someDate);
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
        someDate.getMonth() == today.getMonth() &&
        someDate.getFullYear() == today.getFullYear()
}
const selectDesctription = (message, actionKeyCount) => {
    let description = "";
    if(message[actionKeyCount] != undefined && message[actionKeyCount].toLowerCase().trim() != "tl"){
        description = message.slice(actionKeyCount);
        return description.join(" ");
    } else if(message[actionKeyCount + 1] != undefined ) {
        description = message.slice(actionKeyCount + 1);
        return description.join(" ");
    }
    return "";

}
const parsingVar = (typeVar, val) => {
    if (typeVar == "float") {
        return parseFloat(val.match(/\d*.?(\d)+/g));
    } else if (typeVar == "int") {
        return parseInt(val.match(/\d+/g));
    }
}


MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");

    bot.on('message', (msg) => {
        let username = msg.from.username == undefined ? msg.chat.id : msg.from.username;
        let myobj = {
            firstname: msg.from.first_name,
            chatid: msg.chat.id,
            username: username,
            createdDate: dateVal,
            hitap : hitap
        };

        const sendBotMessage = (chatid, text, opt = "") => {
            if (opt == "") {
                opt = {
                    parse_mode: 'Markdown',
                };
            }
            bot.sendMessage(chatid, text, opt);
            dbo.collection("messages").insertOne({
                username: username,
                direction: 0,
                text: text,
                getDate: today.toJSON()
            }, (err, result) => {
                if (err) throw err;
            })
        }
        const initMessage = () => {
            dbo.collection("customers").find({username: myobj.username}).toArray((err, result) => {
                if (result.length < 1) {
                    dbo.collection("customers").insertOne(myobj, (err, result) => {
                        if (err) throw err;
                        console.log("Added a new boss: " + myobj.chatid + " firstname: " + myobj.firstname + " username: " + myobj.username);
                    });
                    let walletObj = {
                        username: myobj.username,
                        walletName: "nakit",
                        walletType: 1,
                        walletLimit: 0,
                        walletPayday: 0,
                    };
                    dbo.collection("wallets").insertOne(walletObj, (err, result) => {
                        if (err) throw err;
                    });

                }
                console.log(msg.chat.id + " " + msg.from.first_name + " " + msg.text);
                dbo.collection("messages").insertOne({
                    username: myobj.username,
                    direction: 1,
                    text: msg.text,
                    getDate: today.toJSON()
                }, (err, result) => {
                    if (err) throw err;
                })
            })
        }

        initMessage();
        let keys = msg.text.split(" ");
        if(msg.text.toLowerCase().includes("/start")){
            sendBotMessage(myobj.chatid,"Hoş Geldiniz "+hitap,opts);
        }else if (msg.text.toLowerCase() == "yardım") {
            let message = "*// Genel İşlemler //*\n";
            message += "*Ödeme [Tutar] [Açıklama]* ile harcama ekleyebilirsiniz. \n";
            message += "*İade [Tutar] [Açıklama]* ile iptal ekleyebilirsiniz. \n";
            message += "\n";
            message += "*// Rapor İşlemleri //*\n";
            message += "*Günlük rapor* ile günlük harcamalarınızı görebilirsiniz.\n";
            message += "*Aylık rapor* ile aylık harcamalarınızı görebilirsiniz.\n";
            message += "*Yıllık rapor* ile yıllık harcamalarınızı görebilirsiniz.\n";
            message += "\n";
            message += "*// Sepet İşlemleri //*\n";
            message += "*Sepet ekle \[tutar\] \[açıklama\]* ile alışveriş sırasında sepetinize ürün ekleyip kasada süpriz fiyatlar ile karşılaşmazsınız.\n";
            message += "*Sepet çıkar \[tutar\] \[açıklama\]* ile alışveriş sırasında sepetinize eklediğiniz ürünleri bırakınca fiyattan düşersiniz.\n";
            message += "*Sepet boşalt* ile alışveriş sepetinizi boşatabilirsiniz.\n";
            message += "\n";
            message += "Şu an Beta sürümdür yeni özellikler açılmaya devam edecektir.";
            sendBotMessage(msg.chat.id, message, opts);
        } else if (msg.text.toLowerCase().includes("sepet") || keys[0].toLowerCase() == "s") {
            if (msg.text.toLowerCase().includes("ekle") || keys[1].toLowerCase() == "e") {
                const amount = parsingVar("float", keys[2]);
                const description = selectDesctription(keys, 3);
                const basketObj = {
                    username: myobj.username,
                    amount: amount,
                    description: description
                };
                dbo.collection("baskets").insertOne(basketObj, (err, result) => {
                    if (err) throw err;
                })
                const searchObj = {
                    username: myobj.username,
                }
                let data = "";
                let total = 0;
                dbo.collection("baskets").find({username: myobj.username}).toArray((err, result) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        result.map(t => {
                            data += t.description + " >> " + t.amount + "TL\n";
                            total += t.amount;
                        })
                        data += hitap + " toplam sepet tutarınız: " + total + "TL'dir."
                    } else {
                        data += hitap + " sepette hiç bir ürününüz yok."
                    }

                    sendBotMessage(myobj.chatid, data, opts)
                })


            } else if (msg.text.toLowerCase().includes("temizle") || msg.text.toLowerCase().includes("sil") || msg.text.toLowerCase().includes("boşalt") || keys[1].toLowerCase() == "t") {
                const searchObj = {
                    username: myobj.username,
                }
                dbo.collection("baskets").deleteMany({}, (err, result) => {
                    if (err) throw  err;
                });
                sendBotMessage(myobj.chatid, hitap + " sepeti boşalttım, eğer ürünleri satın aldıysanız *Ödeme [Tutar] [Açıklama]* ile harcamanızı ekleyebilirsiniz. İyi Alışverişler diliyorum.")
            } else if (msg.text.toLowerCase().includes("çıkar") || keys[1].toLowerCase() == "ç" || keys[1].toLowerCase() == "c") {
                const amount = parsingVar("float", keys[2]);
                const description = selectDesctription(keys, 3);
                const basketObj = {
                    username: myobj.username,
                    amount: -1 * amount,
                    description: description
                };
                dbo.collection("baskets").insertOne(basketObj, (err, result) => {
                    if (err) throw err;
                })
                const searchObj = {
                    username: myobj.username,
                }
                let data = "";
                let total = 0;
                dbo.collection("baskets").find({username: myobj.username}).toArray((err, result) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        result.map(t => {
                            if (t.amount > 0) {
                                data += t.description + " >> " + t.amount + "TL\n";
                            } else {
                                data += "Çıkartılan" + " >> " + -1 * t.amount + "TL _iptal_\n";
                            }
                            total += t.amount;
                        })
                        data += hitap + " toplam sepet tutarınız: " + total + "TL'dir."
                    } else {
                        data += hitap + " sepette hiç bir ürününüz yok."
                    }

                    sendBotMessage(myobj.chatid, data, opts)
                })

            } else {
                let message = "Eğer sepete birşeyler eklmeke istiyorsanız *Sepet ekle \[tutar\] \[açıklama\]* veya kısaca *s e \[tutar\]* yazmanız gerekiyor. ";
                message += "Eğer sepeti boşaltmak istiyorsanız *Sepet temizle* veya kısaca *s t* yazmanız gerekiyor. "
                message += "İyi alışverişler diliyorum.";
                sendBotMessage(myobj.chatid, hitap + ", " + message, opts);
            }
        } else if ((msg.text.toLowerCase()).includes("rapor") || (msg.text.toLowerCase()).includes("harcama") || (msg.text.toLowerCase()).includes("listele")) {
            if((msg.text.toLowerCase()).includes("gun") || (msg.text.toLowerCase()).includes("gün")){
                const searchObj = {
                    username: myobj.username,
                    "createdDate.day" : today.getDay(),
                    "createdDate.month" : today.getMonth(),
                    "createdDate.year" : today.getFullYear(),
                };
                dbo.collection("transactionDetails").find(searchObj).toArray((err, result) => {
                    let data = "";
                    let total = 0;
                    result.map(t => {
                        if(t.description == "")
                            t.description = "Belirsiz";
                        if(parseFloat(t.amount)<0){
                            data += (t.description).trim(" ") + " _" + -1*t.amount + "TL *iade*_\n";
                        }else if(parseFloat(t.amount)>0){
                            data += (t.description).trim(" ") + " " + t.amount + "TL\n";
                        }
                        total += t.amount;
                    })
                    if (data == "") {
                        sendBotMessage(myobj.chatid, myobj.hitap + " hiç işlem yapmamışsınız.", opts);
                    } else {
                        sendBotMessage(myobj.chatid, myobj.hitap + " durum şu şekildedir; \n" + data+"*Toplam: " + total + "TL harcamışsınız.*", opts);
                    }
                })

            }else if((msg.text.toLowerCase()).includes("ay") ){
                const searchObj = {
                    username: myobj.username,
                    "createdDate.month" : today.getMonth(),
                    "createdDate.year" : today.getFullYear(),
                };
                dbo.collection("transactionDetails").find(searchObj).toArray((err, result) => {
                    let data = "";
                    let total = 0;
                    result.map(t => {
                        if(t.description == "")
                            t.description = "Belirsiz";
                        if(parseFloat(t.amount)<0){
                            data += (t.description).trim(" ") + " _" + -1*t.amount + "TL *iade*_\n";
                        }else if(parseFloat(t.amount)>0){
                            data += (t.description).trim(" ") + " " + t.amount + "TL\n";
                        }
                        total += t.amount;
                    })
                    if (data == "") {
                        sendBotMessage(myobj.chatid, myobj.hitap + " hiç işlem yapmamışsınız.", opts);
                    } else {
                        sendBotMessage(myobj.chatid, myobj.hitap + " durum şu şekildedir; \n" + data+"*Toplam: " + total + "TL harcamışsınız.*", opts);
                    }
                })

            }else if((msg.text.toLowerCase()).includes("yil") || (msg.text.toLowerCase()).includes("yıl") ){
                const searchObj = {
                    username: myobj.username,
                    "createdDate.month" : today.getMonth(),
                    "createdDate.year" : today.getFullYear(),
                };
                dbo.collection("transactionDetails").find(searchObj).toArray((err, result) => {
                    let data = "";
                    let total = 0;
                    result.map(t => {
                        if(t.description == "")
                            t.description = "Belirsiz";
                        if(parseFloat(t.amount)<0){
                            data += (t.description).trim(" ") + " _" + -1*t.amount + "TL *iade*_\n";
                        }else if(parseFloat(t.amount)>0){
                            data += (t.description).trim(" ") + " " + t.amount + "TL\n";
                        }
                        total += t.amount;
                    })
                    if (data == "") {
                        sendBotMessage(myobj.chatid, myobj.hitap + " hiç işlem yapmamışsınız.", opts);
                    } else {
                        sendBotMessage(myobj.chatid, myobj.hitap + " durum şu şekildedir; \n" + data+"*Toplam: " + total + "TL harcamışsınız.*", opts);
                    }
                })

            }else{
                sendBotMessage(myobj.chatid, hitap+" günlük, aylık veya yıllık rapor diye yazabilirsiniz. Şu an söylediğinizi pek anlayamadım. Özür dilerim.", opts);
            }

        } else if ((msg.text.toLowerCase()).includes("istiyorum") ) {
            if (msg.text.toLowerCase().includes("taksit") && testVersion) {
                if (msg.text.toLowerCase().includes("görmek") || msg.text.toLowerCase().includes("liste")) {
                    sendBotMessage(msg.chat.id, "*taksit listele * şeklinde yazarsanız taksitleri görebilirsiniz..", opts);
                } else if (msg.text.toLowerCase().includes("sil")) {
                    sendBotMessage(msg.chat.id, "*taksit ekle \[taksit-no\]* şeklinde yazarsanız taksit oluşturabilirsiniz.", opts);
                } else if (msg.text.toLowerCase().includes("olusturmak") || msg.text.toLowerCase().includes("oluşturmak") || msg.text.toLowerCase().includes("ekle")) {
                    sendBotMessage(msg.chat.id, "*taksit ekle \[Kaç Ay\] \[Aylık Tutar\] \[Aylık Ödeme Günü\] \[Açıklama\]* şeklinde yazarsanız taksit oluşturabilirsiniz.", opts);
                } else {
                    sendBotMessage(msg.chat.id, "*taksit ödemek \[taksit-id\] şeklinde yazarsanız bu günın taksidini ödediğinizi söyleyebilirsiniz.", opts);
                }
            } else if (msg.text.toLowerCase().includes("ödeme") || msg.text.toLowerCase().includes("odeme")) {
                sendBotMessage(msg.chat.id, "*Ödeme \[Tutar\] \[Açıklama\]* ile harcama ekleyebilirsiniz. şu anki tüm yeteneklerim için *yardım* yazabilirsiniz " + hitap +".", opts);
            } else if (msg.text.toLowerCase().includes("arzu") || msg.text.toLowerCase().includes("var")) {
                sendBotMessage(msg.chat.id, "Arzunuz nedir" + hitap +"?", opts);
            } else if (msg.text.toLowerCase().includes("iade") || msg.text.toLowerCase().includes("ıade")) {
                sendBotMessage(msg.chat.id, "*İade [Tutar] [Açıklama]* ile iptal ekleyebilirsiniz. şu anki tüm yeteneklerim için *yardım* yazabilirsiniz " + hitap +".", opts)
            } else if (msg.text.toLowerCase().includes("günlük") || msg.text.toLowerCase().includes("gunluk") || msg.text.toLowerCase().includes("rapor")) {
                sendBotMessage(msg.chat.id, "*Günlük rapor* ile günlük harcamalarınızı gösterebilirsiniz. şu anki tüm yeteneklerim için *yardım* yazabilirsiniz " + hitap +".", opts)
            } else {
                sendBotMessage(msg.chat.id, "Pek anlayamadım " + hitap + "isterseniz *yardım* yazıp şu anda yapabildiklerimi görebilirsiniz.", opts)
            }
        } else if ((msg.text.toLowerCase()).includes("alameddin") || (msg.text.toLowerCase()).includes("sahib") || (msg.text.toLowerCase()).includes("sahip")) {
            sendBotMessage(msg.chat.id, "Alameddin Çelik'ten mi bahsediyordunuz " + myobj.hitap + " neyse konuyu dağıtmadan yapabileceklerim için daha fazla bilgi almak için *yardım* yazabilirsiniz " + myobj.hitap + " " + emoji.get("blush"), opts);
        } else if ((msg.text.toLowerCase()).includes("pahalı")) {
            sendBotMessage(msg.chat.id, "Hayat Pahalı " + myobj.hitap + " " + emoji.get("blush"), opts);
        } else if (((msg.text.toLowerCase()).includes("merhaba") || (msg.text.toLowerCase()).includes("selam")) && !(msg.text.toLowerCase()).includes("aleyküm")) {
            sendBotMessage(msg.chat.id, "Tekrardan hoş Geldiniz " + myobj.hitap + "" + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("nasıl") || (msg.text.toLowerCase()).includes("naber")) {
            sendBotMessage(msg.chat.id, "Çok şükür " + myobj.hitap + ", Bir arzunuz mu vardı" + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("sağol")) {
            sendBotMessage(msg.chat.id, "Sizde sağolun " + myobj.hitap + "." + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("teşekkür")) {
            sendBotMessage(msg.chat.id, "Bende teşekkür ederim " + myobj.hitap + "." + emoji.get("blush"));
        } else if (((msg.text.toLowerCase()).includes("muhasebeci") || (msg.text.toLowerCase()).includes("servet")) && (!(msg.text.toLowerCase()).match(/\w+\b(?<!\muhasebeci)/) || !(msg.text.toLowerCase()).match(/\w+\b(?<!sservet)/))) {
            sendBotMessage(msg.chat.id, "Buyrun " + myobj.hitap + " " + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("aleyküm")) {
            sendBotMessage(msg.chat.id, "Aleyküm Selam " + myobj.hitap + "." + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("görüşürüz") || (msg.text.toLowerCase()).includes("emanet ol") || (msg.text.toLowerCase()).includes("bye bye") || (msg.text.toLowerCase()).includes("hoşça kal")) {
            sendBotMessage(msg.chat.id, "Görüşürüz " + myobj.hitap + ", Hayırlı günler diliyorum." + emoji.get("blush"));
        } else if ((msg.text.toLowerCase()).includes("sev") && !(msg.text.toLowerCase()).includes("miyo") && !(msg.text.toLowerCase()).includes("sevinirim")) {
            //Seviyorum Seviliyorsun Sevilmketesin vs... sev+
            sendBotMessage(msg.chat.id, "Bende " + myobj.hitap + " " + emoji.get("sweat_smile") + ". İzninizle şu hesap kitap işlerine ben geri döneyim.");
        } else if ((msg.text.toLowerCase()).includes("sev") && (msg.text.toLowerCase()).includes("miyo")) {
            //Seviyorum Seviliyorsun Sevilmketesin vs... sev+
            sendBotMessage(msg.chat.id, "Umarım sizi kızdıracak birşey yapmamışımdır " + myobj.hitap + "." + emoji.get("worried"));
        } else if ((msg.text.toLowerCase()).includes("test-sil")) {
            dbo.collection('messages').deleteMany({}, (err, result) => {
                if (err) throw  err;
            });
            dbo.collection('customers').deleteMany({}, (err, result) => {
                if (err) throw  err;
            });
            dbo.collection('installments').deleteMany({}, (err, result) => {
                if (err) throw  err;
            });
            dbo.collection('transactions').deleteMany({}, (err, result) => {
                if (err) throw  err;
            });
            dbo.collection('transactionDetails').deleteMany({}, (err, result) => {
                if (err) throw  err;
            });


        } else if ((msg.text.toLowerCase()).includes("testAccount")) {
            dbo.collection('customers').find({}).toArray((err, result) => {
                if (err) throw err;
                console.log(result)
            })
        } else if (keys.length > 1) {
            const action = keys[0].toLowerCase();

            if (action == "fatura" && testVersion) {
                //telefon faturanız eklendi
            }else if(action == "hitap"){
                const action2 = keys[1]
                const query = { username: myobj.username };
                const values = { $set: {"hitap": action2} };
                dbo.collection("customers").updateMany(query, values, function(err, res) {
                    if (err) throw err;
                });
            }
            else if (action == "taksit" && testVersion) {
                const action2 = keys[1].toLowerCase();
                switch (action2) {
                    //telefon için yaptığınız 24 ay taksit eklendi. her ayın 7sinde size hatırlayacağım.
                    case "ekle":
                        //taksit ekle [kaç ay] [toplam tutar] [odeme günü] [açıklama]

                        const wallet = keys[2]
                        const piece = parsingVar("int", keys[3]);
                        const amount = parsingVar("float", keys[4]);
                        const payDay = parsingVar("int", keys[5]);
                        const description = selectDesctription(keys, 6);

                        const installmentObj = {
                            username: myobj.username,
                            walletName: wallet,
                            piece: piece,
                            amount: amount,
                            payDay: payDay,
                            description: description
                        }


                        dbo.collection("wallets").find({
                            username: installmentObj.username,
                            walletName: installmentObj.walletName
                        })
                        break;
                    case "ödendi":
                        let instId = parseInt(keys[2]);
                        dbo.collection("installments").find({
                            chatid: msg.chat.id,
                            installmentId: instId
                        }).toArray((err, result) => {
                            if (err) throw err;
                            if (result.length == 1) {
                                const incrementPayObj = {
                                    chatid: msg.chat.id,
                                    installmentId: installmentID,
                                    createdDate: dateVal,
                                };
                                dbo.collection("installmentPays").insertOne(incrementPayObj, (err, result) => {
                                    if (err) throw err;
                                })
                            }
                        })
                        break;
                    case "sil":

                        break;
                    case "listele":
                        dbo.collection("installments").find().toArray((err, result) => {
                        });
                        break;
                }
            }
            else if (action == "ödeme" || action == "odeme") {
                //ödeme nakit 150tl araba
                //const wallet = keys[1];
                const val = parsingVar("float", keys[1]);
                let description = "";
                description += selectDesctription(keys, 2);


                // Adding a spending
                let totalCount = 0;
                const transactionObj = {
                    username: myobj.username,
                    amount: val,
                    wallet: "nakit",
                    createdDate: dateVal
                };
                const transactionObjDetails = {
                    username: myobj.username,
                    amount: val,
                    wallet: "nakit",
                    description: description,
                    createdDate: dateVal
                };
                // Add Transaction
                dbo.collection("transactions").insertOne(transactionObj, (err, result) => {
                    if (err) throw err;
                });

                // Add Transaction
                dbo.collection("transactionDetails").insertOne(transactionObjDetails, (err, result) => {
                    if (err) throw err;
                });
                const searchObj = {
                    username: myobj.username,
                    "createdDate.day" : today.getDay(),
                    "createdDate.month" : today.getMonth(),
                    "createdDate.year" : today.getFullYear(),
                };

                // List Transactions
                dbo.collection("transactions").find(searchObj).toArray((err, result) => {
                    result.map(t => {
                        totalCount += t.amount
                    })
                    sendBotMessage(myobj.chatid, "Ekledim " + myobj.hitap + ",bu gün toplamda " + totalCount + currentMoney + ' harcama yaptınız.', opts)
                });

            } else if (action == "iade" || action == "İade" || msg.text.toLowerCase().includes("ade")) {
                let totalCount = 0;
                const val = parsingVar("float", keys[1]);
                let description = "";
                description += selectDesctription(keys, 2);

                const transactionObj = {
                    username: myobj.username,
                    amount: -1 * val,
                    wallet: "nakit",
                    createdDate: dateVal
                };
                const transactionObjDetails = {
                    username: myobj.username,
                    amount: -1 * val,
                    description: description,
                    createdDate: dateVal
                };
                // Add Transaction
                dbo.collection("transactions").insertOne(transactionObj, (err, result) => {
                    if (err) throw err;
                });

                // Add Transaction
                dbo.collection("transactionDetails").insertOne(transactionObjDetails, (err, result) => {
                    if (err) throw err;
                });

                const searchObj = {
                    username: myobj.username,
                    "createdDate.day" : today.getDay(),
                    "createdDate.month" : today.getMonth(),
                    "createdDate.year" : today.getFullYear(),
                };

                dbo.collection("transactions").find(searchObj).toArray((err, result) => {
                    result.map(t => {
                        totalCount += t.amount
                    })
                    sendBotMessage(myobj.chatid, "İade aldım " + myobj.hitap + ",bu gün toplamda " + totalCount + currentMoney + ' harcama yaptınız.', opts)
                });

            } else if (action == "soyleona") {
                const who = parsingVar("int", keys[1]);
                const description = selectDesctription(keys, 1);
                sendBotMessage(who, description);
            } else if (action == "test-guncelleme") {
                const who = parsingVar("int", keys[1]);
                let message = "Güncelleme İle yeni özellikler açılmıştır. Version 0.11.0\n\~";
                message += "*// Genel İşlemler //*\n";
                message += "*Ödeme [Tutar] [Açıklama]* ile harcama ekleyebilirsiniz. \n";
                message += "*İade [Tutar] [Açıklama]* ile iptal ekleyebilirsiniz. \n";
                message += "\n";
                message += "*// Rapor İşlemleri //*\n";
                message += "*Günlük rapor* ile günlük harcamalarınızı görebilirsiniz.\n";
                message += "*Aylık rapor* ile aylık harcamalarınızı görebilirsiniz.\n";
                message += "*Yıllık rapor* ile yıllık harcamalarınızı görebilirsiniz.\n";
                message += "\n";
                message += "*// Sepet İşlemleri //*\n";
                message += "*Sepet ekle \[tutar\] \[açıklama\]* ile alışveriş sırasında sepetinize ürün ekleyip kasada süpriz fiyatlar ile karşılaşmazsınız.\n";
                message += "*Sepet çıkar \[tutar\] \[açıklama\]* ile alışveriş sırasında sepetinize eklediğiniz ürünleri bırakınca fiyattan düşersiniz.\n";
                message += "*Sepet boşalt* ile alışveriş sepetinizi boşatabilirsiniz.\n";
                message += "\n";
                message += "Şu an Beta sürümdür yeni özellikler açılmaya devam edecektir.";

                dbo.collection('customers').find({}).toArray((err,result)=>{
                    result.map( r =>{
                        sendBotMessage(r.chatid, message);
                    })
                })
            } else {
                sendBotMessage(msg.chat.id, "Konuyu anlayamadım. İsterseniz *Yardım* yazıp yapabileceğim hizmetleri öğrenebilirsiniz.", opts);
            }
        } else {
            sendBotMessage(msg.chat.id, "Konuyu anlayamadım. İsterseniz *Yardım* yazıp yapabileceğim hizmetleri öğrenebilirsiniz.", opts);
        }
    });
});


// Listen for any kind of message. There are different kinds of
// messages.
