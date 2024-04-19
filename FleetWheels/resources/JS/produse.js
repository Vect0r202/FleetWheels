window.onload=function(){

    document.getElementById("inp-pret").onchange=function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`;
    }

    document.getElementById("filtrare").onclick = function(){
        let val_nume=document.getElementById("inp-nume").value.toLowerCase();
        var masini=document.getElementsByClassName("car");
        let gr_radio=document.getElementsByName("gr_rad");
        let val_power;
        for(let r of gr_radio){
            if(r.checked){
                val_power=r.value;
                break;
            }
        }

        let val_pret=document.getElementById("inp-pret").value;
        let val_comb=document.getElementById("inp-combustibil").value;

        for(let c of masini){
            c.style.display="none";
            let nume=c.getElementsByClassName("val-nume")[0].innerHTML.toLowerCase();
            let power=parseInt(c.getElementsByClassName("val-power")[0].innerHTML);
            let pret=parseInt(c.getElementsByClassName("val-price")[0].innerHTML);
            let comb=c.getElementsByClassName("val-combustibil")[0].innerHTML;
            
            [nra,nrb]=val_power.split(":");
            nra=parseInt(nra);
            nrb=parseInt(nrb);

            let cond1=nume.startsWith(val_nume);
            let cond2=(nra<=power && power<nrb);
            let cond3=(val_pret<=pret);
            let cond4=(val_comb==comb || val_comb=="toate");

            if(cond1 && cond2 && cond3 && cond4){
                c.style.display="block";
            }
        }
        
        console.log("a");

    }
    document.getElementById("resetare").onclick = function(){
        document.getElementById("inp-nume").value="";
        document.getElementById("inp-pret").value=document.getElementById("inp-pret").min;
        document.getElementById("inp-combustibil").value="toate";
        document.getElementById("i_rad4").checked=true;
        var masini=document.getElementsByClassName("car");
        for(let c of masini){
            c.style.display="block";
        }
    }
    function sorteaza(semn){
        var masini=document.getElementsByClassName("car");
        var v_masini=Array.from(masini);
        v_masini.sort(function(a,b){
            var pret_a=parseFloat(a.getElementsByClassName("val-price")[0].innerHTML);
            var pret_b=parseFloat(b.getElementsByClassName("val-price")[0].innerHTML);
            if(pret_a==pret_b){
                var nume_a=a.getElementsByClassName("val-nume")[0].innerHTML;
                var nume_b=b.getElementsByClassName("val-nume")[0].innerHTML;
                return semn*nume_a.localeCompare(nume_b);
            }
            return (pret_a-pret_b)*semn;
        })
        for (let c of v_masini){
            c.parentNode.appendChild(c);
        }
    }

    document.getElementById("sortCrescNume").onclick=function(){
        sorteaza(1);
    }
    document.getElementById("sortDescrescNume").onclick=function(){
        sorteaza(-1);
    }
    
}