const express=require("express");
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const {Client} = require('pg');


var client=new Client({database:"postgres",
    user:"postgres",
    password:"lala123",
    host:"localhost",
    port:5432});

client.connect();

client.query("select * from test", function(err, rez){
    console.log("Eroare BD",err);
    console.log("Rezultat BD", rez.rows);
});

client.query("select * from unnest(enum_range(null::tip_masina))",function(err, rez){
    console.log(err);
    console.log(rez);
})


obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname, "resources/scss"),
    folderCss: path.join(__dirname, "resources/css"),
    folderBackup: path.join(__dirname, "backup")
}

app= express();

console.log("Cale proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

vectorFoldere=["temp", "temp1", "backup"]
for(let folder of vectorFoldere){
    //let caleFolder=__dirname+"/"+folder;
    let caleFolder=path.join(__dirname,folder);
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        // let vectorCale=caleScss.split("\\");
        // let numefisExt=vectorCale[vectorCale.length-1];
        let numefisExt=path.basename(caleScss);
        let numefis=numefisExt.split(".")[0];
        caleCss=numefis+".css";
    }
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss, caleCss);
    // let vectorCale=caleCss.split("\\");
    // let numeFisCss=vectorCale[vectorCale.length-1];
    let caleResBackup=path.join(obGlobal.folderBackup, "resources/css");
    if(!fs.existsSync(caleResBackup))
        fs.mkdirSync(caleResBackup, {recursive:true});
    let numeFisCss=path.basename(caleCss);
    if(fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup,"resources/css", numeFisCss))
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss, rez.css);
}

vFisiere=fs.readdirSync(obGlobal.folderScss)
for(let numeFis of vFisiere){
    if(path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss,function(eveniment, numefis){
    console.log(eveniment, numefis);
    if(eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numefis);
        if(fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})


app.set("view engine" , "ejs");

app.use("/resources", express.static(__dirname+"/resources"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));

app.use(/^\/resources(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function(req,res){
    afiseazaEroare(res, 403);
})

app.use(/^\/resources(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*\.ejs$/, function(req,res){
    afiseazaEroare(res, 400);
});

app.get("/favicon.ico", function(req,res){
    res.sendFile(__dirname+"/resources/ICO/favicon.ico");
});

app.get("/ceva", function(req,res){
    res.send("<h1>SALL!</h1>");
});

app.get(["/index","/","/home"], function(req,res){
    res.render("pagini/index" , {ip: req.ip, a:10, b:291, imagini:obGlobal.obImagini.imagini});
});

// ?????????????
// app.get(["/views/pagini"], function(req,res){
//     res.render("pagini/fleet.ejs" , {imagini:obGlobal.obImagini.imagini});
// });
// ?????????????

app.get("/fleet",function(req, res){

        client.query("select * from unnest(enum_range(null::tip_combustibil))",function(err, rezComb){
            let conditieWhere="";
            if(req.query.tip_masina)
                conditieWhere=` where tip_masina='${req.query.tip_masina}' and pret>32`;
            client.query("select * from masini" + conditieWhere , function( err, rez){
                console.log(300)
                if(err){
                    console.log(err);
                    afiseazaEroare(res, 2);
                }
                else
                    res.render("pagini/fleet", {masini:rez.rows, optiuni:rezComb.rows});
            });
        });
            
    
        
});


app.get("/car/:id",function(req, res){
    console.log(req.params);
   
    client.query(`select * from masini where id=${req.params.id}`, function( err, rezultat){
        if(err){
            console.log(err);
            afiseazaEroare(res, 2);
        }
        else
            res.render("pagini/car", {prod:rezultat.rows[0]});
    });
});

client.query("select * from unnest(enum_range(null::tipuri_masini))",function(err, rez){
    console.log(err);
    console.log(rez);
})


app.get("/*",function(req,res){
    try{
        res.render("pagini"+req.url, function(err, resRandare){
            if(err){
                console.log(err);
                if(err.message.startsWith("Failed to lookup view "))
                    afiseazaEroare(res, 404);
                else afiseazaEroare(res);
            }
            else{
                console.log(resRandare);
                res.send(resRandare);
            }
        });
    }catch(err){
        if(err.message.startsWith("Cannot find module ")){
            afiseazaEroare(res,404);
        }
    }
    
});

function initErori(){
    var continut=fs.readFileSync(__dirname+"/resources/json/erori.json").toString("utf-8");
    //console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    let vErori = obGlobal.obErori.info_erori;
    // for(let i=0;i<vErori.length; i++){
    //     console.log(vErori[i].imagine)
    // }
    for(let eroare of vErori){
        eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initErori();

////////////////////////////////////////////

function initImagini(){
    var continut=fs.readFileSync(__dirname+"/resources/json/galerie.json").toString("utf-8");
    // console.log(continut);
    obGlobal.obImagini=JSON.parse(continut);
    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleMediu = path.join(caleAbs, "mediu"); //folder in care vom crea imaginile de dimensiuni medii
    let caleMare = path.join(caleAbs, "mare"); //folder in care vom crea imaginile de dimensiuni mari
    if(!fs.existsSync(caleMediu)){
        fs.mkdirSync(caleMediu);
    }
    if(!fs.existsSync(caleMare)){
        fs.mkdirSync(caleMare);
    }
    let vImagini = obGlobal.obImagini.imagini;
    for(let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleAbsFisier=path.join(caleAbs,imag.fisier);
        let caleAbsFisierMediu=path.join(caleMediu,numeFis)+".webp";
        let caleAbsFisierMare=path.join(caleMare,numeFis)+".png";
        sharp(caleAbsFisier).resize(1000).toFile(caleAbsFisierMare);
        sharp(caleAbsFisier).resize(400).toFile(caleAbsFisierMediu);
        imag.fisier_mediu="/"+path.join(obGlobal.obImagini.cale_galerie,"mediu", numeFis+".webp");
        imag.fisier_mare="/"+path.join(obGlobal.obImagini.cale_galerie, "mare", numeFis+".png");
    }
}
initImagini();

/* 
Daca programatorul seteaza titlul, se ia titlul din argument
daca nu e setat, se ia cel din json,
daca nu avem titlul nici in json se ia titlul din valoarea default
idem pentru celelalte
*/

function afiseazaEroare(res, _identificator, _titlu="titlu default", _text, _imagine){
    let vErori = obGlobal.obErori.info_erori;
    let eroare= vErori.find(function(elem){return elem.identificator==_identificator;})
    if(eroare){
        let titlu1 = _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu;
        let text1 = _text || eroare.text;
        let imagine1 = _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("pagini/eroare" , { titlu:titlu1 , imagine:imagine1 , text:text1});
        else
            res.render("pagini/eroare" , { titlu:titlu1 , imagine:imagine1 , text:text1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare" , { titlu:errDef.titlu , imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
}

app.listen(8080);
console.log("Serverul a pornit!");