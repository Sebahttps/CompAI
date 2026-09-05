/* ==========================================================================
   LA AGENTE compAI — nube de partículas.  CinemAI · 29-ago-2026
   --------------------------------------------------------------------------
   LA FIGURA NO ES UN ARCHIVO. Sustituye a los tres mp4 del agente y a sus
   tres fotogramas de respaldo por un enjambre de ~4.600 glifos —3 de cada 4
   son un '0' o un '1'— que persigue un mapa de tono horneado (5,6 KB de
   texto) con una inercia distinta por partícula. Al desplazarse la página el
   DESTINO se mueve y cada partícula lo sigue a su ritmo: la nube se estira,
   se retrasa y se recompone. No hay ninguna figura rígida y no viaja un solo
   byte de vídeo.

   Tres gestos, un solo motor:

   1 · LA REVERENCIA DE SALUDO (portada). Encargo textual de Sebastián: «la
       presentación del sitio la hace compai en primer plano al tener contacto
       con la pantalla, al recomponerse LENTAMENTE en la página de inicio, al
       lado del título, sólo debería quedar levitando o simular una reverencia
       de saludo». Las mayúsculas de LENTAMENTE son suyas.

   2 · LA AGENTE PRESENTE. No sigue un recorrido escrito: MIDE el layout de
       cada sección y se coloca en el hueco real que esa sección deja. El
       hueco decide el tamaño Y el encuadre —cuerpo entero, plano medio o
       plano cerrado—. Si no hay hueco digno, no aparece.

   3 · EL DESTAQUE. Encargo textual: «destacando algo con las mismas
       partículas y/o códigos». Definido como función abajo, en §F.

   Cero librerías · cero CDN · cero peticiones · cero base64.
   La paleta y la tipografía son tokens de VisuAI: aquí se LEEN, no se tocan.
   ========================================================================== */
(function(){
'use strict';

/* ---- CinemAI 4-sep: parametros de presentacion por URL (P2) -------------
   Solo LEEN. Sin query, los valores son exactamente los del motor publicado. */
var _CQ = location.search + location.hash;
function _cn(k, d){
  var m = new RegExp('[?&#]' + k + '=(-?[0-9.]+)').exec(_CQ);
  return m ? parseFloat(m[1]) : d;
}
var CLENTO = _cn('lento', 1);      /* multiplica la dilatacion del tiempo */
/* LA REVERENCIA VA SACADA POR DEFECTO EN ESTA LANDING, y es una decision mia
   con numero detras (ver la entrega): `?rev=1` devuelve la del sitio publicado
   y `?rev=2.6` la lenta, para poder comparar las tres sin reconstruir. */
var CREV   = _cn('rev',   0);      /* multiplica la reverencia; 0 la saca  */
/* GANANCIA x1,3 EN ESTA LANDING, elegida MIRANDO tres renders a igual reloj
   (`_capturas/_tira-alfa.png`): x1 se lee fina para una lamina donde la figura
   es lo unico que hay, y x1,6 empasta el pelo y los hombros y le quita el
   «hecha de digitos». La vara medida sube de 2,33 a 2,67. `?alfa=1` devuelve
   exactamente el brillo del sitio publicado. */
var CALFA  = _cn('alfa',  1.3);    /* multiplica la ganancia de la nube    */

var raiz   = document.documentElement;
var fig    = document.getElementById('agente');
var lienzo = document.getElementById('nube');
if(!fig || !lienzo) return;

var reducido = matchMedia('(prefers-reduced-motion:reduce)').matches;
raiz.className += ' js';

/* ------------------------------------------------------------------ curvas */
function _A(a,b){return 1-3*b+3*a}
function _B(a,b){return 3*b-6*a}
function _C(a){return 3*a}
function _cal(t,a,b){return ((_A(a,b)*t+_B(a,b))*t+_C(a))*t}
function _pen(t,a,b){return 3*_A(a,b)*t*t+2*_B(a,b)*t+_C(a)}
function bez(x1,y1,x2,y2){
  return function(x){
    if(x<=0)return 0; if(x>=1)return 1;
    var t=x,s;
    for(var i=0;i<7;i++){ s=_pen(t,x1,x2); if(!s)break; t-=(_cal(t,x1,x2)-x)/s; if(t<0)t=0; if(t>1)t=1; }
    return _cal(t,y1,y2);
  };
}
var ENTRA = bez(.16,1,.3,1);      /* algo aparece: desacelera fuerte     */
var SALE  = bez(.7,0,.84,0);      /* algo se va: acelera                 */
var MICRO = bez(.34,1.56,.64,1);  /* micro-gesto, con sobrepaso          */
var RITMO = bez(.45,0,.55,1);     /* la dilatación del tiempo, simétrica */
function sat(v){return v<0?0:v>1?1:v}

/* ==================================================================
   A · EL BUSCADOR DE HUECOS
   Rasteriza lo que la sección OCUPA y busca el mayor rectángulo libre.
   No hay una sola coordenada escrita a mano.
   ================================================================== */
var CAJA = 'img,svg,video,canvas,input,textarea,select,button,table,iframe';
var CEL = 8;
var secciones = [], ocupados = [];

/* Qué cuenta como OCUPADO: el texto por sus LÍNEAS (Range.getClientRects),
   que siguen a la tinta —la caja del párrafo miente cuando una palabra larga
   desborda—, y por separado todo lo que tiene presencia visual propia:
   controles, medios y cualquier elemento con borde o fondo, porque el
   interior vacío de una tarjeta con marco tampoco es un hueco. */
function opaco(cs){
  if(cs.backgroundImage !== 'none') return true;
  var b = cs.backgroundColor;
  if(b.indexOf('rgba(') === 0){ if(parseFloat(b.split(',')[3]) > 0.02) return true; }
  else if(b && b !== 'transparent') return true;
  return !!(parseFloat(cs.borderTopWidth) || parseFloat(cs.borderBottomWidth) ||
            parseFloat(cs.borderLeftWidth) || parseFloat(cs.borderRightWidth));
}
function recoger(sec, sx, sy){
  var lista = [], i, j;
  function mete(r){ if(r.width > 2 && r.height > 2)
    lista.push({x:r.left+sx, y:r.top+sy, w:r.width, h:r.height}); }
  var todos = sec.querySelectorAll('*');
  for(i=0;i<todos.length;i++){
    var el = todos[i], cs = getComputedStyle(el);
    if(cs.visibility === 'hidden' || cs.display === 'none') continue;
    if(el.matches(CAJA) || opaco(cs)) mete(el.getBoundingClientRect());
  }
  var tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, null), n, rs;
  var rg = document.createRange();
  while((n = tw.nextNode())){
    if(!/\S/.test(n.nodeValue)) continue;
    rg.selectNodeContents(n);
    rs = rg.getClientRects();
    for(j=0;j<rs.length;j++) mete(rs[j]);
  }
  return lista;
}

/* Los rectángulos libres maximales NO dependen del aspecto: sólo su
   puntuación. Se enumeran UNA vez y se puntúan con los tres encuadres. */
function mayor(caja, lista, pad, ars){
  var cols = Math.floor(caja.w/CEL), filas = Math.floor(caja.h/CEL);
  if(cols < 4 || filas < 4) return null;
  var occ = new Uint8Array(cols*filas), i, j;
  for(var n=0;n<lista.length;n++){
    var r = lista[n];
    var a = Math.floor((r.x - pad - caja.x)/CEL), b = Math.ceil((r.x + r.w + pad - caja.x)/CEL);
    var c = Math.floor((r.y - pad - caja.y)/CEL), d = Math.ceil((r.y + r.h + pad - caja.y)/CEL);
    if(a<0)a=0; if(c<0)c=0; if(b>cols)b=cols; if(d>filas)d=filas;
    for(j=c;j<d;j++){ var o=j*cols; for(i=a;i<b;i++) occ[o+i]=1; }
  }
  /* el clásico del histograma: alturas por columna y pila monótona */
  var h = new Int32Array(cols), pX = new Int32Array(cols+1), pH = new Int32Array(cols+1);
  var mejor = new Array(ars.length); for(i=0;i<ars.length;i++) mejor[i]=null;
  for(j=0;j<filas;j++){
    for(i=0;i<cols;i++) h[i] = occ[j*cols+i] ? 0 : h[i]+1;
    var top = 0;
    for(i=0;i<=cols;i++){
      var cur = (i<cols) ? h[i] : 0, ini = i;
      while(top>0 && pH[top-1] >= cur){
        top--;
        var hh = pH[top]; ini = pX[top];
        var w = (i-ini)*CEL, ht = hh*CEL;
        if(w>=40 && ht>=40){
          var rx = caja.x + ini*CEL, ry = caja.y + (j-hh+1)*CEL;
          for(var z=0;z<ars.length;z++){
            var cabe = Math.min(w/ars[z], ht), M = mejor[z];
            if(!M || cabe*cabe*ars[z] > M.cabe*M.cabe*ars[z])
              mejor[z] = {x:rx, y:ry, w:w, h:ht, cabe:cabe};
          }
        }
      }
      pX[top]=ini; pH[top]=cur; top++;
    }
  }
  return mejor;
}

/* DÓNDE dentro del hueco. 0 = pegada al contenido, 1 = al canto opuesto.
   0,28 salió de mirar cuatro secciones con 0 / 0,28 / 0,5 / 1: acompaña al
   contenido sin tocarlo, que es lo único que funciona en los cuatro casos. */
var BIAS = 0.28;
function colocar(bs, vh, cx, forzar, yMin){
  if(!bs) return null;
  /* EL HUECO ELIGE EL ENCUADRE, y gana el que MÁS LLENA el hueco —no «el
     primero que quepa», probado así el cuerpo entero cabía siempre—. La
     aritmética resuelve sola la regla: alto pide cuerpo, ancho pide cara. */
  var mejorP = null, mejorA = 0;
  for(var q=0;q<ENC.length;q++){
    if(forzar !== null && forzar !== undefined && q !== forzar) continue;
    var E = ENC[q], b = bs[q];
    if(!b) continue;
    /* EL TECHO SE QUEDA COMO ESTABA: MARCHA ATRAS MIA DEL 31-ago. Lo cambie
       por uno de igual AREA (`vh*0.68*sqrt(ar_cerrado/ar)`) razonando que el
       limite es cuanta pantalla ocupa la figura, no su alto. Razonamiento
       correcto, efecto malo y medido: (1) con el techo dentro de la
       puntuacion los tres encuadres empatan en area y gana el primero del
       array POR ORDEN, no por forma -en `cotizar` puso un cuerpo entero de
       320x810 donde la seccion pide plano medio, silueta 4,7 contra 20-37-;
       y (2) 810 px de figura en una ventana de 900 no se ven enteros, que es
       lo que el encargo pide. Y no hacia falta: el hueco de la portada lo
       fija el slot. LA REGLA QUE QUEDA: una correccion que arregla la pieza
       que miro y cambia el criterio de eleccion de las otras cuatro no es una
       correccion, es un cambio de alcance. */
    var H = Math.min(b.cabe*0.88, vh*0.68, 640);
    /* EL AIRE CEDE ANTES QUE LA FIGURA, medido a 805 px de alto -un
       portatil-: alli el hueco de la portada da cabe 552 y el 0,88 de aire lo
       deja en 486, seis px bajo la puerta, y la portada se quedaba SIN
       FIGURA. El sitio estaba; se lo comia el margen. Se toma lo justo para
       pasar y ni un pixel mas. Los topes duros -`vh*0.68` y 640- NO ceden:
       existen para que el cuerpo entero quepa en pantalla. A 900 no se
       dispara (H=542 ya pasa) y la portada publicada no se mueve. */
    if(H < E.min && Math.min(b.cabe*0.98, vh*0.68, 640) >= E.min) H = E.min;
    var W = H*E.ar;
    if(W > b.w*0.92){ W = b.w*0.92; H = W/E.ar; }
    var y = b.y + (b.h-H)/2;
    /* EL TECHO SE APLICA AQUI Y NO EN EL RASTERIZADOR. Primero lo meti como
       una banda ocupada mas y la PORTADA se movio: 214x542 -> 206x521, grano
       5,52 -> 5,25. Marcar la banda cambia la enumeracion de rectangulos
       maximales de TODA la seccion, tambien donde el techo no tapaba nada.
       Aqui la condicion va al final y solo muerde si muerde: lo que no
       quedaba bajo el header sale identico al ultimo decimal. */
    if(yMin && y < yMin){
      var disp = b.y + b.h - yMin;
      if(H > disp){
        H = disp; W = H*E.ar;
        if(W > b.w*0.92){ W = b.w*0.92; H = W/E.ar; }
      }
      y = yMin;
    }
    /* LA PUERTA NO BORRA UNA DECISION EDITORIAL: donde hay `data-enc` -escrito
       a mano por un encargo literal- hay figura, y la puerta solo puede
       quedarse corta. Donde el motor elige solo, la puerta manda. Sin esto,
       bajo ~740 px de alto de ventana la portada se quedaba EN BLANCO. Lo que
       cuesta, dicho: bajo ese alto su glifo no llega a 5 px -tambien en lo
       publicado, 4,54- y se pinta en puntos. */
    if(H < E.min && (forzar === null || forzar === undefined)) continue;
    if(W*H > mejorA){
      /* P1 (CinemAI 4-sep): SIN CONTENIDO NO HAY LADO AL QUE ACOMPANAR.
         cx===null significa que la seccion no tiene ni una caja ni una
         linea de texto -la lamina 1 del brief es «SIN TEXTO»-, y la rama
         `else` la dejaba al 72 % del ancho. El encargo dice «en medio de
         la pantalla». */
      var f = (cx === null) ? 0.5 : (cx < b.x + b.w/2 ? BIAS : 1-BIAS);
      mejorA = W*H;
      mejorP = {h:H, w:W, enc:q, x:b.x + (b.w-W)*f, y:y};
    }
  }
  return mejorP;
}

/* EL TECHO PEGAJOSO, y por que faltaba: el buscador de huecos razona en
   coordenadas de PAGINA y el <header> vive en coordenadas de VISOR, asi que
   ningun rectangulo del rasterizador lo veia. En `cotizar` la caja arrancaba
   29 px POR ENCIMA del borde del visor y el header se comia sus 95 px de
   arriba —la cabeza, que es lo de mas contraste—: cociente 2,13 contra 18-27
   del resto. Defecto de mi instrumento, no limitacion del diseno.
   No se busca por clase -la maqueta es de VisuAI-: vale cualquier pegado o
   fijo ANCLADO EN CERO que no contenga secciones, que es lo que separa al
   header de `.cine-stage` (sticky con `top:var(--hdr)` y con `[data-sec]`). */
function techo(){
  var t = 0, todos = document.body.querySelectorAll('*'), i;
  for(i=0;i<todos.length;i++){
    var el = todos[i], cs = getComputedStyle(el);
    if(cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if(parseFloat(cs.top) !== 0) continue;
    if(el.querySelector('[data-sec]') || el.hasAttribute('data-sec')) continue;
    /* TIENE QUE TAPAR, no solo estar pegado arriba: sin esto el primer
       candidato es MI PROPIO lienzo -`#nube` es fixed, top 0, pantalla
       entera-, `techo()` daba 900 y se quedaban sin figura las CINCO
       secciones. Se reusa `opaco()`, el mismo criterio de ocupacion. */
    if(!opaco(cs)) continue;
    var r = el.getBoundingClientRect();
    if(r.width < innerWidth*0.5 || r.height <= 0) continue;   /* una barra, no un panel */
    if(r.height > innerHeight*0.4) continue;                  /* una barra, no una portada */
    if(r.height > t) t = r.height;
  }
  return t;
}

function medir(){
  var sx = window.pageXOffset, sy = window.pageYOffset;
  var vw = innerWidth, vh = innerHeight;
  var mg  = Math.max(16, Math.min(44, vw*0.03));
  var pad = Math.max(14, Math.min(34, vw*0.02));
  if(!ENC[0].min) calibrarMin();
  var hdr = techo();
  var docH = document.documentElement.scrollHeight;
  secciones = []; ocupados = [];
  var ars = ENC.map(function(E){return E.ar;});
  var secs = document.querySelectorAll('[data-sec]');
  for(var s=0;s<secs.length;s++){
    var sec = secs[s], sr = sec.getBoundingClientRect();
    var lista = recoger(sec, sx, sy);
    for(var e=0;e<lista.length;e++) ocupados.push(lista[e]);
    var x0 = Math.max(sr.left+sx, mg), x1 = Math.min(sr.right+sx, vw-mg);
    var caja = {x:x0, y:sr.top+sy, w:x1-x0, h:sr.height};
    /* HASTA DONDE LLEGA EL TECHO EN COORDENADAS DE PAGINA, en la PARADA de
       esta seccion: el scroll donde `elegir()` la da por activa, o sea su
       centro en el centro del visor, topado por el documento. */
    var yMin = 0;
    if(hdr > 0){
      var sc = Math.max(0, Math.min(docH - vh, sr.top+sy + sr.height/2 - vh/2));
      yMin = sc + hdr + pad;
    }
    var mx = 0, ma = 0;
    for(e=0;e<lista.length;e++){          /* el centro de masa es del CONTENIDO */
      var q = lista[e], ar = q.w*q.h;
      mx += (q.x + q.w/2)*ar; ma += ar;
    }
    /* data-enc fuerza el encuadre de una sección. Existe por un encargo
       literal —la presentación es «en primer plano»— y se declara en el
       HTML para que se pueda cambiar sin tocar el motor. */
    var fz = sec.getAttribute('data-enc');
    var idx = null;
    if(fz){ for(var z=0;z<ENC.length;z++) if(ENC[z].n===fz) idx=z; }
    /* los tres candidatos se GUARDAN. Cuando una seccion se queda sin figura
       hay que poder decir con numero cuanto hueco le falta -es una peticion a
       la maqueta, que es de VisuAI- y no «no cabe». */
    var bs = mayor(caja,lista,pad,ars);
    /* P4 (CinemAI 4-sep): LA CAJA MANDADA. `data-caja` en un elemento de la
       seccion dice DONDE va la figura, y el buscador de huecos no opina.
       Mismo diseno que `data-enc`, que ya existe: una decision editorial se
       declara en el HTML, no se codifica en el motor. NO cambia el criterio de
       eleccion de ninguna seccion que no lo lleve — es opt-in puro.

       Por que hace falta, y es un fallo real del buscador que hasta hoy no se
       podia ver: cuando el ALTO es lo que limita, `cabe = min(w/ar, h)` vale h
       para TODOS los rectangulos suficientemente anchos, todos empatan en
       puntuacion y gana EL PRIMERO QUE ENCUENTRA EL BARRIDO, que no es ninguno
       en particular. En el sitio vivo no muerde porque toda seccion tiene
       texto y el texto rompe los empates; en una lamina «SIN TEXTO» el empate
       es masivo y la figura aterrizo a 128 px del canto izquierdo cuando el
       encargo dice «en medio de la pantalla». Los topes de alto (0,88 del
       hueco, 0,68 del visor y 640 px) siguen aplicandose: la caja mandada dice
       DONDE, no CUANTO. */
    var cj = sec.querySelector('[data-caja]'), mandada = false;
    if(cj){
      var cr = cj.getBoundingClientRect();
      if(cr.width > 8 && cr.height > 8){
        mandada = true;
        bs = ars.map(function(ar){
          return {x:cr.left+sx, y:cr.top+sy, w:cr.width, h:cr.height,
                  cabe:Math.min(cr.width/ar, cr.height)};
        });
      }
    }
    secciones.push({el:sec, top:sr.top+sy, bot:sr.bottom+sy, bs:bs, yMin:yMin,
                    luz:sec.querySelector('[data-luz]'),
                    pos:colocar(bs, vh, mandada ? null : (ma ? mx/ma : null), idx, yMin)});
  }
}

function libre(a,b){
  var x0=Math.min(a.x,b.x), y0=Math.min(a.y,b.y);
  var x1=Math.max(a.x+a.w,b.x+b.w), y1=Math.max(a.y+a.h,b.y+b.h);
  if(y1-y0 > innerHeight*2.0) return false;
  for(var i=0;i<ocupados.length;i++){
    var o=ocupados[i];
    if(o.x-6 < x1 && o.x+o.w+6 > x0 && o.y-6 < y1 && o.y+o.h+6 > y0) return false;
  }
  return true;
}

function elegir(){
  var mid = window.pageYOffset + innerHeight/2, q, i;
  for(i=0;i<secciones.length;i++){ q=secciones[i]; if(mid>=q.top && mid<q.bot) return q; }
  return secciones.length ? secciones[mid < secciones[0].top ? 0 : secciones.length-1] : null;
}

/* ==================================================================
   B · ESTADO DE LA FIGURA
   ================================================================== */
var cx=0, cy=0, tx=0, ty=0;
var baseH=300, k=1;
var ca=0, fa=null;
var destino=null, pendiente=null, seccion=null;
var modo = 'espera', tLlego = -1e9;

function reescalar(H){
  var pintado = baseH*k;
  baseH = H; k = pintado/H;
  fig.style.height = H.toFixed(2)+'px';
  fig.style.width  = (H*ARa).toFixed(2)+'px';
}
function fundir(a, dur, curva){ fa = {de:ca, a:a, t0:reloj, d:dur, c:curva}; }

/* ==================================================================
   C · LA NUBE
   ================================================================== */
/* EL MAPA DE TONO, HORNEADO DESDE LA FIGURA OFICIAL. Rejilla de 88x165
   celdas de 3.74 px nativos sobre la caja 329x617 recortada de
   `Hola, soy Compai.jfif`; tono cuantizado a 16 niveles. A..P = tono 1..15;
   el resto = carrera de ceros. 6.178 B de texto, sin una sola petición ni un
   byte de base64.

   DE DÓNDE SALE Y POR QUÉ CAMBIÓ. El 30-ago Sebastián miró el sitio ya
   publicado: «me gusta el movimiento, el agente NO es el de la imagen
   original». El motor no tenía culpa —el mapa anterior venía de
   `_agente-viva/_fig-mirada.png`, un derivado ESTIRADO (aspecto 0,351) de la
   familia correcta, y esa deformación borraba las piernas y fundía el bajo
   del vestido en un charco de luz—. La figura oficial tiene aspecto 0,533 y
   piernas. El fallo de fondo era de TRAZABILIDAD: el mapa vivía como una
   cadena dentro de un HTML de 79 KB sin un byte que dijera de qué imagen
   salió. Ahora lo hornea `hornear.py` desde el archivo oficial y escribe su
   fuente, su sha1 y sus hitos en `_mapa.json`.

   GW y GH NO son magia: el ancho lo fija el barrido de `hornear.py` y el
   alto sale del aspecto real de la caja, así que `GW/GH` ES el aspecto de la
   figura y las coordenadas de rejilla se normalizan con ellos. Antes había
   un 300 y un 855 escritos a mano en cuatro sitios: si el mapa cambiaba de
   tamaño, la figura salía desplazada sin un solo error. */
var MASA='++++++++++ZB+3C+3CCBBBBBBXBSB+YBWBBBCDCDDDCCCBTICSC+dBQBCFKHJLJOPGIHFCBBQBGDRC+ZFDSFBCGMOJMOKLLHPNKHDCCBQCBCB+WBWDEIKLLIPNJEHLOONINFCCBBDC+YGDUGHMJLJFLJIGIJNOPPNFDCCDFC+YECTBCINJHFFIIIEIHKKPNPOMFCDBBC+YCBBCCCILKJDDEFGEDEINJMIOPPFECQBDF+RBVCBBCGNGJEEDDCGFFEFKHNJOPPNECBBBCB+QDVBCBCKLGFEECCCCDFEHMGNHMPPKECBBRCB+WBCCFOMFGKCDCBBDEDDFEMMNOPPHCCCRED+WBCDJPMMKIEDBQBCDDDICILLPPOHCCECB+YBCDKNPPKEDCCBCDGGDIDIMPOPKLCCCCCB8DYBCDJNOJGGDDBBBDDCBBCFJLHMPLDECBBBC+WBCDKPOKLGEDCEBQCBCGCEJMNPPNFDDCBQBBB5BQCRBQBCQBCDHPILKGFEBCBDFDBGCIHMPOPPHCCBCCBDRBBUBtDRCDWBCCDKPMOPIFCDDQBRCDCHHNMJMPNCCBSCCRBCDyHQBHCBBSBCCDEKONOMEFDBBQCCCEFCCEIIILHDCCBUBQBBCCDFxBDEFDBBDDEDEFNPNONGFCCBBEFFCDCDJJLKMLECBBVCCRBCFsBQEBDDQDDBDDCGFIGHPPKPMEECCCBDCCCGCFHIHMPLECCBVCDTEuBRCCBBBIJJIKEFIPPLNKFHECFDBCDCECFHLJINOKECBWBBSBsCTBCDCBECIFEGHJOPOMLHGFDDCDDDDFCEHJMKOMMCGDE2CVBDBBEEBFDKFFHKPPNNGFDFECBCCFKDEGJJNONHFECDBCB1BRBCCFCBBCBCDFDDJMPNPPIFDCGCBBFGGDHOPPPPPKDDBRFC0BWBBBDCFCFCDIJNPPPNIEEFBDBCEFFGOPPMKLGDBB+SBBBBBBCCGKILPPPPGDCDCCCCFIEHOPPMMLFECBBBBBRBC5EBQFCBCELIKLPNPPNKEDCEGDDGFOPPPNMGEDCBBBBBRCE8BCCIEHIINPPPPPKFDEDDGGGMPOPMLLIHFBBBBBB8DCEQCEBCCDIHLNPNOPOIEDFGIGINPLNOMNKCEBBEDB+RBDBBCDGEDGJOONPJFFGEEIJJJOMOKLHKDDCCCCB+RBFDBCEDECGHKJJPKEFEDFFHLKOJNGEJICCCBBB7BTBBSBBCCCEJKJIKGFFDCDDGGIOGHGDGFJCBDDVCE0BTDEUBBDDFMNPKHDEGDCCDDHMOKIKDIJEEB3BSCCBRDDBBUBBCEKPNJMFDECBCBCCFIKPOLGFFCDTDTCzBCRBBDQBFRDDCEJMOOIFDDECQCCBCGJHKJMNKFCCBTBDRCwBRCDQBTBBBCFIGEGGGLEHDCFDRCBDFDGKHGJIKKHESCQCxBBEDBCDCBUBEJHHFCJEGFECCDDECBCBCCHFDEDIGDGHIHCWCCxBIFDDDEDCDLLHEEDCCDGECBBEFCDFCBBICDGCCEFGGMKCBQDRGyBQBTBCCCHPJEFCDECDFFCCQCDCCCBBBECGEBCDCEGGFGCBBRDyDTBRBBFLIDDBBCEDCCBEEBQCBBBSCBFCBEGCDEEEIDE1BEDUCFBEIFCCCCCEBEICECCBEVHCDFCDGEEECDFKCTERCuBWBCDFFGGBCCDCDDCDDBBBBQBQCQECDDCDDBBCCDGICCCBSCuCFRBBSBDHHGGCRBCCDDCEDDBBRBSHEDHQIIBRCEHLGFBGUC1EHNGDGCDDBDBBEQCCRCCCBQBQCBFGQEGCQBDIHHESFTC2HJGJFCBBBDCDCQEDSCDCEHQGCDDQCECDGGHMGDWCCyDCRBCIEBCHGBFCDFQFERCBCBDFQEBFGQBCBDDDILHDZBwBRGDEIEEDFDCFCCBRCSCDCQDQDCCDQDFBBBEGJOFRCQCSB2CMOGLHDDCGCDBBEDRBCDCQHQIECDQFHBDDFHINCTCSBxDTBHOGGFCDCDDBCQCSCCDRCQCBEFQBFDFCBEEGCBCECRC4BIKDEDGJHGEDDQCBQCQBCQCFQGEQBQDDFFBQCCIFWBCCQBzCMGFDEGNLEDCDQECSBRDFQFCBCBDDDBBCBBFE+BCLDCDFFPPKHDFBBRBQDCRCRDBBBDECBCBBDFIXCBBzDCGFCEFFOPKICDQBRBQCBRFRECCCJIFCBBQDCCCSBQBDB0BCHGCFFHLPPKJECQBRBQBBRCQEDDCCJIMGCCBDCGKSCxCWCIGHJFGINPKJEDCDCBCQCBQCEQECEFGHHPIDBQBEDETCQB2BJIFEEHKLPPNFEDECCEQCREGRBJKKIJIEDCQCQCDTE4DHEGDHKLIPNOFICDCBBQCSBRBEEFMPGFFDCDRDDBB4EQEFEIFDHKHNLPIHECBCFQBRDGQBCGGDIMGDHEBBQCHKDDQDQC0DCHDCDBDJMFIJKIHDCQCFTBEBCCFGDFGGCIJDCQCIEDTD1DFDEBCFDDENNKHMFFTDEDBCBDDHJIIHGDFOFEQDBQD0DUCCCGBCDIDJPLLGIECTDFEBBBEEIJKMIIDDMHECDRFUCEtCUCDEDBEHEDFKJIIGEDQCDBCCBBBBBDHFJMPLDCFDDDCBDIHvCYCFCBCDDGDFJJIGHEFCCBQCCBCECGEGHHKNOFCEECCDDHQG3CQBJBCBCCEDJIIIJICFQCCQDCQEJCEDGHHMPNICCCCCQEEDC0DRDCHCBBFEFEDLFGHGFBECCEQCDDCCCGDFGJLPKJCBBCGBDCCECxFQBRCQCBBCBEECIKDGFEFFEEBCQDCCDJBDDHGGFKEJCBEGDCFBGGEB0EQDEDDQBCECFEDFEDDSDDCDDCBFBDCFJHFGFDEBBDDFBQCEBuCDRCRCRDQCBQFDDJLEFGDGQEBCFBEFCEFDHGGIHGHDGHBBCGBCDFEBTBvCQBFDQDBDDCFLKEGLBDQDQCEQEEDFHDEEFFDDFCEEBBEKDBCDBFTDTBgBYCCBLCCEDDCCGHIEFFBEQCBBDQFFCCCBECFGEDDCDDBBBGGDCCEKFwBTCKEGGCCCCHDIDDHCDQEDSFFBFJQGFJJGFBBDECRCGICFFEDtBBQCESCDCCEIDBBFCECBFCEQBRBQDCQFJQECFGDFFBCFCSEEDIIGFBsCCBICERCHHGCDCCEGFHCEJDIQIFSFDQBFQFFHGDJHBCFBBQBCIIJHMGByDCCIEBDFEDGFCEBFFSGEQCQFCRCRBFICECBCDFBQBCJHHGHCEsFWCGBBCGCGIDCJBCCDFSCDWDBGHQFHBECICDBBDDIHLKIBXCnEFBDGCEEFCMJDDHBBBBDSBDQCBTEBFFQGICEDHDBBBDHNFIIFCFtBQEBBJIGEFDCNMFEFBCCBETBQCBVBCQDGCCELJBBBDGLMNMLDCtBRBCLHECIBCNKDDHBQCDFVFUEBGJQIHDDEHJDQBDFLPMNNFCBSDrDCLGEEJCDHMGDDRBQBVCSCQBQFHQDFCCEGIBBBCDNIKOOLFBSCoERFDLEKDECDFJFEFRBQFTEWCTDGCGGEEDBBEHJGHONODBaBXBRBUCQBBCJJGFGCDHJEEFSBDTGWETBCBFHEFICBCHIHHIIMGBsBBBCGKJJJHDGPPHCCBERDQHEQBQCBTCTGGEFDDGKCBCCFOIHHHICrBDDBCGJKFHLEIOMFFGCBQBFQCBCEBFDTEDSGGBDDCENGBBCIMIKHIMEBVDdEUDDFCDMIJNNLELILFECCBBCDSFHBGFREQHISGFCEFDEIHCBCFKGJHHMFDZCXCQDBTDBQBDNHKNMNGHFKFDBCDDEDQECCKBFEBSHESEFFFDEEHKBBDCGEHFFGCaCZBHBTCQBEMJJPPNGHGHEDDBDCCGCCBDICGFTFDSCEGKFFEFHCBBCDEFKGJDRECDDEbDBQCXBDIMNPPNGHIMHCBQCDBHCGFINCDCTEDSEFEEEEDHHDBBCCGDDGFUBQBDkDQBCJMOPOKFKLNIDCCDDFIEEEHLCGFTEESBCBCFFCDGEBBCDECCFBGsBQBCHNMOOMGJFLLFDBDCEECFEIIBFETIGBRFGCCCDDKIGCCCJJGDBQBSBhBVDQBCFKPPOGKLHNJEHDDEGHCFEIMCDGCBRCCCREECCDECFFGDCCFECBvFBBCDGOPOFHGEKFEIEEFEDCGDCCBGJFBRGHBRDDDCCDCFFDGCCBSBCmBQCWBCDIONHIDGLGDDDDDDHCEDCQBCEGBCBIGSGGBDDGEDGHFCCBXDgCbBBCFDCFHDHEEDEEEGFEECBBBFHFCCBHDDBQFFEHCGCFEDHHCDVCrEUBBBCEDDJFGHEEGFJDDDFJBEFEBDBIGECQGKEGDLHGGDDGCBQETBrEXBEGFMEECCGDDJEFDCBBFGFBDQEFCBQHLFGCKGGCDDGEBWDzBFGHFCCDCHGEEDDDEFBFDEDBQFJGCQDGEEBHGJEGGHLCBrBUBRBUCGEFJEDFCEDCBDFDGHBDECBREEGGDGHEGDHEIEEEILDBCByCUGFEFECCDCFFDDEEBBDBFIFCDBEHFCBDFEEBEDEJIMGJDCCCBBVEDCBjCXGDCEGDDIFFEFDDFDDHDDGHCCBDHIDBFKCDBEDENNHHGIGHCBDQCrCXHHCEHCDGCDFEECGFBCCHJLECBEEGGBGIFGCEDLKKJJJNHGDBRC0IFDCCBEGEIFFCCEDCHFIGLHECGGGCFEDCCDHFKIHGMMKEHFCQCSCtERCGBECIDDGDJHFCBDBEEDFFJKJFFGFDEFHBCEHGMIGHFEDCBBRC0BDBFCICHKFJJEBCHCEGCEHLNJDGKJDBDEDCGEHJHIIDCBRBDCD5DCEGDFJFCCBCBDFJGLNJFEFEDDGHFJDCFGCDBBBQDBEvBbFCRBCICECBBBDIMFDFDDDCQBCBDGHKFHGDBRDCFGFEUB1BTBGIECGDQEEIDCECCBCQBCBEIIGDCCBeC5BIDFBGQCDDFFCHHDBBCBQEHIKDFCB+bBGFDBCBQCEFGCDDCFECCCHJHICECUC+XDFDBCCDCEHFBCDDEEECBFFFFCBBXCE8DUHFBCEBQCEFDBFHFCEEBCGEKHCCBSCTB+TDIDBBBCDEEFCCCGCDECBDEGGHCDB+cDIEBCQBHHEFDDEJHGCDDFFEIHCBZD+SBEDDBQGCEGFCDHNIDCDHHHIKICDB+ZBBBBEFCCQDFCFECDJNKHKHJGHINFBCYBB9BDBBCIGDBBCCDDCCDJNLJHKIGJLLEBUBUC8DBFBBDHGDFEBDGFDCDJMIKGHHFFLIDBUB+WBEIKGEFECCEEEEDHHFHGEFGJMECWC+TBQBCGIFDCCGEJHGCCEHFKJGILLJDE+XBSBRBEDDDBCGDFGICCDJJJGGIHKDBB+VCQBSCSFDBDCEGDFDGCEEKJHJJGGECB+gCGEDBCEDDEIEJHKIIFIIICBCD+VCTCTBDDBQBDDDFGFKKHHGEFJGBBQBQC+TBTDTBDCFBBCDECJILLJEDCGHCBSBCBC+WCCBRBGFIBGECFCFHIKJDDEEFBTE+dBCDECBECCDDDEJJFGFEGFBUB+bBBBEECBCBCCFFCHIGDEGKEBTCFCB+YCFRCDDBECCDDCCCDCCCDGJBRBBQB+cDBBDDBECDGCCBBEDDDDHJCBQBC+YBTBDCBBCEDCBFBCBCFDCDDDFCBTBQB+dCCDCCDDFEBDHDEBCDEDUBDD+XCUBEDCECEDDBEIEFCCDFDUB+ZBRBCQCGECECCBBBCDDBBBQCEBSCBQB+bBQBGECEBDGCBCDBBBCDFGECUE+eFHDCBBDBBBDCBBQCDFGDSBQD+YBBTFFBBDFFBBCGCBCDCFIGB+bBRDTBDCBDCDEBQDFDDCDCFHD+hBCRBCBEDCDBBBDDCCBEFGC+iBQBBCDDCDDCBBBCCEDFHHC+gDRDBBDCBCDFCBBDDCGGEGFB+kBBCCDCDEEBBBBDFDCDBVB+dBQBGEEDEFGBBBBCCBBB+hBSDBCFHEFEEGCBB+nCQBBCCFFGEFEFGCCBB+oCDCDIHFFFFHHECBB+oCDCGIHGEGGGHDCBB+mDQCCCGHHHHHHHHEBB+nBCECEHHHHFGHHHEBB+oCBDEHGHFEGFEHFCB+oBBCDHGFDDEDFGGCB+qBCEEEFEDDEFDB+tBCCDDDDCCB++++++++++++++R';
var CER='QRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var GW=88, GH=165;

/* CUÁNTAS. Elegido MIRANDO el barrido 2.600/3.400/4.200/5.000/6.200 a 612 px:
   por debajo de 4.000 la figura es un fantasma y a partir de ~5.600 el pelo se
   cuaja en pasta y deja de leerse hecho de dígitos. El techo NO es el
   rendimiento —a 1,8-2,4 ms de mediana por cuadro caben ~10.000—: es la imagen. */
var NP = 4600;
var DEN = 40;                 /* la inercia se sortea 1..41 fotogramas */
var CDF = null, encActual = 0;
var ARa = 0;                  /* se fija ABAJO, cuando ENC ya existe */
var NPB = NP;

/* EL SEMITONO. El volumen sale de la densidad local, no de un contorno:
   agrupar aclara, enralecer oscurece. GAMA=1,00 hace que la densidad lleve el
   tono uno a uno (contraste de densidad 15:1 sobre el mapa); y como la
   densidad YA lleva el tono, la opacidad se APLANA para no castigar dos veces
   —su único trabajo es que el borde se disuelva, doctrina §2.5—. */
var GAMA = 1.55, OPEXP = 0.45, OPPISO = 0.10;
/* GAMA 1,00 -> 1,55 y OPPISO 0,22 -> 0,10 el 31-ago, MIRANDO el recorte de la
   caja a 2x y no la pagina entera. Con GAMA 1 la densidad llevaba el tono uno
   a uno y el enjambre repartia particulas por todo el rectangulo: 68 % de las
   celdas del encuadre `cerrado` tienen tinta, asi que un reparto plano PINTA
   EL RECTANGULO, no la persona. Con 1,55 el muestreo se concentra donde el
   mapa es claro (pelo, hombros, manos) y el piso de opacidad mas bajo deja
   que el canto se disuelva de verdad -doctrina 2.5-. Medido con `silueta.py`
   dentro de la caja, a igual ALFA: cociente 11,81 -> 16,14 y correlacion con
   el mapa 0,652 -> 0,722. Ni una particula mas: NP no se toca. ALFA se vuelve
   a DESPEJAR con `afinar.py` para que la vara de VisuAI no se mueva.       */

/* Un hueco alto y angosto pide el cuerpo entero; uno bajo y ancho pide el
   primer plano. Lo que NO se puede hacer y queda registrado: «de perfil» de
   verdad exige un SEGUNDO mapa horneado —el material es frontal y no hay
   información lateral que muestrear—. Aquí no se finge un perfil. */
/* LOS TRES ENCUADRES, REMEDIDOS SOBRE EL MAPA CANÓNICO (30-ago). No se
   heredan: los del mapa anterior recortaban por sitios que en esta figura no
   son los mismos, porque la otra estaba estirada y no tenía piernas. Los
   hitos salen del ANCHO DE TINTA POR FILA -que dibuja el perfil del cuerpo
   mucho mejor que la suma de tinta, que sólo dice dónde hay brillo- y quedan
   escritos en `_mapa.json`:

     coronilla v 0,043 · línea de hombro v 0,128 · más ancho (dobladillo y
     manos) v 0,555 · dobladillo v 0,677 · pie v 0,957.
     Tinta: v 0,055..0,939 · u 0,161..0,816.  Cabeza y hombros: u 0,184..0,770.

   Proporción, que es lo que delataba al mapa viejo: aquí la cabeza mide el
   12 % del alto (0,043..0,128), o sea ~1/8 de cuerpo, que es una persona. En
   el mapa estirado medía el 20 % y por eso el cuerpo entero salía sin piernas.

   ENVOLVENTE DEL CUERPO ENTERO, y esto es una decisión que cambia: venía con
   cab 0,44 / pie 0,66 porque VisuAI pidió disolver «el bulto de cabeza y
   hombros arriba y el charco de luz del pie abajo». En la figura canónica no
   hay charco -era un artefacto del mapa estirado- y ese pie 0,66 borra las
   PIERNAS, que es justo lo que Sebastián echó en falta. Se retira a los
   cantos de verdad: cab 0,10 / pie 0,94. Los dos v de este encuadre caen
   FUERA de la tinta (0,030 < 0,055 y 0,975 > 0,939), así que el recorte no
   corta nada y la envolvente sólo tiene que rematar el canto del cuadro.
   Queda anotado para VisuAI: si prefiere volver a la disolución, son dos
   números en esta línea.

   EL PLANO CERRADO SE ABRE HASTA v1 0,480, Y NO POR GUSTO. Con v1 0,290
   -cabeza y hombros literales- el recorte sale APAISADO (ar 1,26), porque en
   esta figura los hombros son más anchos que alto tiene la banda cabeza-pecho;
   el buscador de huecos le daba entonces una caja de 514x407 y ahí el glifo
   -que escala con la magnificación- se come la estructura: rendido y mirado,
   es una niebla rectangular de dígitos, no una persona. Barrido en la página
   real a 1440 (`_barre_cerrado.py`), v1 -> aspecto -> caja que da el hueco:

     0,290 -> 1,262 -> 514x407     0,420 -> 0,841 -> 420x500
     0,360 -> 0,994 -> 497x500     0,480 -> 0,729 -> 364x500

   A 0,480 el retrato vuelve a ser VERTICAL y es el único de los cuatro en el
   que se leen la corona de pelo, el óvalo oscuro de la cara y la caída de los
   hombros. La escalera queda 0,395 / 0,557 / 0,729 de aspecto y 1,00 / 1,41 /
   1,97 de magnificación: tres opciones bien separadas para el hueco, que es
   para lo que existen. */
/* GAMA ES POR ENCUADRE, y no por gusto (31-ago). GAMA existe para pelear el
   RECTANGULO: si el recorte tiene tinta en casi todas sus celdas, un reparto
   plano pinta la caja y no la persona, y hay que concentrar el muestreo donde
   el mapa es claro. Pero «casi todas» depende del recorte, y esta medido:
   tinta 68,4 % en el cerrado, 64,6 % en el medio, 55,9 % en el CUERPO ENTERO
   -que ademas tiene una silueta que se reconoce sola-. El 1,55 se despejo
   mirando el primer plano; heredado al cuerpo entero MATA LAS PIERNAS, que
   son tono medio: con GAMA 1,55 el peso del pelo contra el de una pierna es
   5,4:1 y con 1,00 es 3,0:1. Se barre por encuadre y se mira. */
/* `min` ya NO se escribe: lo despeja `calibrarMin()` de la ley del grano en
   cuanto `campo()` conoce NP y la tinta de cada recorte. Arranca en 0 y
   `medir()` no coloca nada hasta que este calibrado. */
var ENC = [
  {n:'entero',  u0:0.140, u1:0.840, v0:0.030, v1:0.975, min:0, cab:0.10, pie:0.94, gama:1.55},
  {n:'medio',   u0:0.140, u1:0.840, v0:0.030, v1:0.700, min:0, cab:0.10, pie:0.74, gama:1.55},
  {n:'cerrado', u0:0.170, u1:0.785, v0:0.030, v1:0.480, min:0, cab:0.10, pie:0.90, gama:1.55}
];
for(var e_=0;e_<ENC.length;e_++)
  ENC[e_].ar = (ENC[e_].u1-ENC[e_].u0)*GW / ((ENC[e_].v1-ENC[e_].v0)*GH);
/* VA AQUÍ Y NO ARRIBA. Con `ARa = ENC[0].ar` colocado antes de la asignación
   de `var ENC`, el hoisting deja ENC en undefined y el script entero revienta
   —y la página se ve vacía SIN UN SOLO ERROR registrado, porque el manejador
   vive dentro del script que muere—. Regla general, no anécdota: el colector
   de errores va en un <script> aparte y ANTES (ver el <head>). */
ARa = ENC[0].ar;

/* LA ENVOLVENTE VERTICAL, Y AHORA UNA POR ENCUADRE. VisuAI: a 1440 la nube no
   falla porque FALTE la persona sino porque SOBRA la insinuación de persona,
   así que en el CUERPO ENTERO se disuelven los dos extremos que delatan al
   cuerpo —el bulto de cabeza y hombros arriba, el charco de luz del pie
   abajo—: cab 0,44 / pie 0,66, calibrado y medido (el charco cayó de 17,5 %
   a 7,0 % de la masa y la cabeza de 10,7 % a 2,1 %).

   Pero esos mismos números aplicados al PRIMER PLANO lo destruyen, y esto
   salió de mirarlo: el recorte cerrado ES la cabeza y los hombros, o sea que
   cab 0,44 apaga la corona y pie 0,66 apaga los hombros, y lo único que
   sobrevive es la banda del medio —que en un contraluz es la parte OSCURA—.
   Rendido a 435x500 daba una neblina rectangular sin cabeza ni hombros.
   La envolvente existe para disolver el CANTO DEL ENCUADRE, y en un primer
   plano el canto de arriba es la coronilla (que ya se desvanece sola en el
   mapa) mientras el de abajo es un corte arbitrario por el pecho: es ése el
   que hay que fundir.

   SEGUNDA CORRECCIÓN, la que zanjó el choque: cab 0,08 / pie 0,70 seguía
   dando un DONUT —un anillo de pelo flotando sin cuello ni hombros—, y no
   por casualidad: con el recorte v 0,060..0,340, la barbilla cae en v local
   0,70 EXACTO, o sea pie 0,70 disolvía justo los hombros. Se abre el recorte
   hasta v1 0,402 (los hombros completos, medidos: la cabeza ocupa v
   0,088..0,257 y el hombro va hasta v 0,339) y la envolvente se retira a los
   cantos de verdad: cab 0,10 / pie 0,90. Un primer plano ES cabeza y hombros;
   sin los hombros no hay primer plano, hay una mancha.

   Y lo que NO se puede hacer, medido y no supuesto: el mapa NO TIENE CARA.
   Rasterizada la cabeza del material —los tres mp4 y el fotograma de origen—
   el rostro es un óvalo NEGRO dentro de un halo de pelo: es un contraluz y no
   hay ni un ojo que muestrear. «Legible como cara» no está sobre la mesa con
   este material; «legible como cabeza y hombros en contraluz» sí, y es lo que
   se entrega. Inventar rasgos sería dibujarlos yo, que es exactamente el
   fallo del 24-ago que creó este agente.

   Sebastián zanjó el choque con VisuAI a favor del primer plano legible. La
   palanca para volver atrás sigue siendo una línea: u/v y cab/pie del cerrado.

   Va sobre la v LOCAL de cada encuadre: con la v global, el primer plano se
   muestrea justo de la banda que la envolvente del cuerpo entero apaga. */
var ENVP = 0.04;
function env(v, E){
  var CAB = E.cab, PIE = E.pie;
  var a = v<CAB ? v/CAB : 1, b = v>PIE ? (1-v)/(1-PIE) : 1, s = a<b?a:b;
  return ENVP + (1-ENVP)*s*s*(3-2*s);
}

/* LA GANANCIA GLOBAL. El criterio de oficio se escribe con un número: la
   figura no debe pasar de ~3x la masa luminosa del botón de cotizar en el
   primer pliegue, o el CTA deja de ser el destino de la mirada. Un solo
   número y multiplica AL FINAL, para que no haya dos sitios donde subirle el
   volumen a la figura. Se mide con `_agente-viva/masa.py`.

   0,2582 NO se eligió: se DESPEJÓ midiendo, con `afinar.py`, hasta caer en
   2,41x —bajo la línea de ~3x que fijó VisuAI—. Y hay que despejarlo porque
   la masa no es lineal en ALFA: medido, 0,1554 da 1,21x y 0,85 da 13,67x, o
   sea multiplicar por 5,47 el alfa multiplicó por 11,3 la masa. La causa es
   la EOTF —la vara suma luz LINEAL sobre una captura de 8 bits en sRGB, y
   cerca del negro un escalón de código vale poquísima luz—, así que cualquier
   regla de tres sale corta: el primer barrido apuntó a 2,5x y aterrizó en
   1,20/1,35/1,62x. Con el encuadre anterior esto valía 0,40 y daba 1,05x: la
   figura pesaba lo mismo que el botón y por eso no se leía. */
/* P5 (CinemAI 4-sep): `?alfa=N` multiplica la ganancia, para poder BARRER el
   brillo de la figura y ELEGIRLO MIRANDO, no a ojo. 0,3961 no es un numero de
   gusto: lo DESPEJO `afinar.py` el 29-ago para que la vara figura/CTA de VisuAI
   quedara en 2,41x en el sitio publicado —la masa no es lineal en el alfa, asi
   que se resuelve, no se elige—. En la lamina 1 de este brief no hay CTA ni
   titular que proteger (es «SIN TEXTO»), de modo que esa restriccion no aplica
   aqui y el valor se vuelve a elegir contra lo unico que queda: que la figura
   se lea como IMAGEN PRINCIPAL. Sin `?alfa` el valor es el publicado, exacto. */
var ALFA = 0.3961*CALFA;

var CUERPO = 1/139, FRENTE = 0.075, ZOOM = 3.0;

/* EL GRANO SE ACERCA CON LA CÁMARA, y esto faltaba. El cuerpo del glifo valía
   H/139 —proporcional a la CAJA— y la caja mide lo mismo en los tres
   encuadres, así que el mismo hueco pintaba el cuerpo entero y el primer plano
   con glifos del MISMO tamaño. Es un error de cámara: en un primer plano el
   sujeto está 2,7 veces más cerca, y su grano tiene que estar 2,7 veces más
   cerca también. Con el grano fijo, el primer plano salía sembrado de confeti
   —3.071 puntos de 3,6 px repartidos por 417x500— y por eso no cerraba forma.
   MAG es la magnificación vertical del encuadre contra el cuerpo entero:
   entero 1,00 · medio 1,68 · cerrado 2,69. Es un cociente medido del propio
   recorte, no una constante elegida.

   Y el detalle que explicaba el confeti mejor que ninguna otra cosa: el
   dibujante cambia de técnica bajo 5 px —«por debajo de 5 px un '0' no es un
   dígito, es un punto»— y con el grano fijo el primer plano caía a 3,6 px, o
   sea el 92,5 % de sus partículas se pintaban como PUNTOS de 1 px. El plano
   cerrado nunca llegó a estar hecho de dígitos. Ahora son 9,66 px.

   El exponente se barrió a IGUAL MASA (`barrer.py --obj`, cada punto con su
   propio ALFA despejado, porque si no se compara brillo y no grano): 0,50 /
   0,75 / 1,00. Gana 1,00 mirándolo, y es además el único que no necesita
   justificación: es la magnificación real de la cámara. */
var MAGEXP = 1.0000;
function mag(E){ return Math.pow((ENC[0].v1-ENC[0].v0)/(E.v1-E.v0), MAGEXP); }

/* EL GRANO SIGUE AL ESPACIADO, NO A LA CAMARA. Correccion del 31-ago, y
   corrige a MI mismo: `mag` es la magnificacion vertical del encuadre y
   dice «en un primer plano el sujeto esta 2,10 veces mas cerca, luego su
   grano tambien». Eso seria cierto si al acercar la camara llegaran 2,10
   veces mas particulas, y NO llegan: NP es el mismo numero repartido dentro
   del recorte. Lo que gobierna si el enjambre se ve TEJIDO o se ve POLVO no
   es la camara, es la razon entre el cuerpo del glifo y la DISTANCIA MEDIA
   entre particulas vecinas; con glifo mayor que la distancia hay masa
   continua, con glifo menor hay huecos.

   Medido en la pieza publicada, que es lo que delata el error: el primer
   plano pinta 4.401 glifos de 7,55 px sobre 364x500 con tinta en el 68,4 %
   del recorte -> distancia media 5,32 px, glifo/distancia 1,42, masa
   continua. El cuerpo entero con el mismo `mag` pinta los mismos 4.401 de
   5,01 px sobre 275x697 con tinta en el 55,9 % -> distancia 4,94 px,
   glifo/distancia 1,01: la MITAD de cobertura por glifo, y por eso salia
   difuso aunque los numeros de silueta subieran.

   La distancia media entre particulas es sqrt(area_de_tinta / NP), asi que:

       gb = KGRANO * sqrt(W * H * tinta(encuadre) / NP)

   `tinta` NO se escribe a mano: la cuenta `cdfDe` sobre el propio mapa al
   arrancar, de modo que si el mapa cambia el grano se recalibra solo. KGRANO
   se despejo para que el PRIMER PLANO publicado no se mueva ni un decimal
   (7,55 px con 364,3x499,8 y tinta 0,684), asi que esto no re-afina nada de
   lo ya juzgado: solo arregla los otros dos encuadres. El equivalente en la
   escala vieja pasa de 1,00/1,41/2,10 a 1,50/1,78/2,10. */
var KGRANO = 1.4195;
var TINTA = [1, 1, 1];   /* lo rellena campo(); 1 solo hasta que exista mapa */
/* escalera geometrica del 5 % en el cuerpo del glifo: con el cuerpo cambiando
   en cada cuadro la cache de glifos de Skia no acierta nunca. Es funcion y no
   linea suelta para que la sonda de verificacion lea EL MISMO numero que se
   pinta -un gb que se recalcula en dos sitios se separa sin avisar-. */
function granoDe(q, H){
  var g = KGRANO*H*Math.sqrt(ENC[q].ar*TINTA[q]/NP);
  if(g<0.6) g=0.6;
  return Math.exp(Math.round(Math.log(g)/0.04879)*0.04879);
}
function grano(H){ return granoDe(encActual, H); }

/* EL UMBRAL NO ES UNA OPINION: ES EL INTERRUPTOR DE ESTE RENDERIZADOR. Mas
   abajo esta escrito `if(g >= 5)` -fillText, un digito- y su `else`
   -fillRect, un punto-. Por debajo de 5 px el 92,5 % de la figura deja de
   estar hecha de digitos; solo el plano de FRENTE (7,5 %) tiene suelo propio
   de 7 px. Ampliado a 3x en vecino mas cercano: a 5,52 px se leen 1, 0, 4, 5;
   a 2,53 px es una espuma de motas MAS FINA que la lluvia del campo (11-16
   px), o sea el material invertido. El umbral se hereda del renderizador. */
var GBMIN = 5;

/* CUANTO ALTO PIDE CADA ENCUADRE PARA LLEGARLE. `min` estaba escrito a mano
   -210/170/120- en la escala VIEJA del grano; al cambiar la ley del grano por
   la portada no volvi a derivar la puerta, y seguia dejando pasar huecos que
   la ley nueva condena: 4 de las 5 secciones publicadas pintaban por debajo
   del interruptor. No eran dos secciones sueltas, era la REGLA. Ahora se
   despeja de la ley y se sube por la escalera del 5 % hasta que el grano QUE
   SE PINTA pasa: cambia el mapa o el NP y se recalibra sola. */
function calibrarMin(){
  if(!CDF) return;
  for(var q=0;q<ENC.length;q++){
    var H = GBMIN/(KGRANO*Math.sqrt(ENC[q].ar*TINTA[q]/NP));
    var t = 0;
    while(granoDe(q,H) < GBMIN && t++ < 200) H *= 1.005;
    ENC[q].min = Math.ceil(H);
  }
}
/* LOS GLIFOS, ordenados por TINTA MEDIDA: 'L' el más ligero, 'Q' el más
   pesado, 2,08:1 de rango. Y el hallazgo que lo hace gratis: '0' pesa 277,6 y
   '1' pesa 180,9 — el propio par binario YA es un semitono de dos niveles. */
var GLI = 'L7TJFI1CY352SEZPV4UK96XAHGORD8NB0WMQ', SESGO = 0.62;
var BINARIO = 0.75;     /* 76,4 % binario, 23,6 % letras (barrido mirado) */
var DESTELLO = 0.60;

var g2 = lienzo.getContext('2d');
var LW=0, LH=0, DPR=1, FAM='monospace';
var pu,pv,pin,pinl,pgl,pjx,pjy,pxs,pys,pfa,pz,pop,pmk,pdx,pdy,tramos=[],ND=0;
var paleta = ['#96948E','#ABA8A1','#BFBCB4','#D5D1C7','#EBE6DB','#FFFCEF'];
var sSuave=0, sembrar='pantalla', asentar=false;
var sucio=[0,0,0,0];

/* PRNG determinista (mulberry32): ?t= tiene que dar SIEMPRE el mismo cuadro,
   o ninguna captura sirve para juzgar. */
function dado(s){ return function(){
  s|=0; s=s+0x6D2B79F5|0;
  var t=Math.imul(s^s>>>15,1|s);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;
};}

function tallar(){
  DPR = Math.min(2, window.devicePixelRatio || 1);
  LW = innerWidth; LH = innerHeight;
  lienzo.width  = Math.round(LW*DPR);
  lienzo.height = Math.round(LH*DPR);
  g2.setTransform(DPR,0,0,DPR,0,0);
  g2.textAlign='center'; g2.textBaseline='middle';
  sucio=[0,0,LW,LH];
  var cs = getComputedStyle(raiz);
  FAM = (cs.getPropertyValue('--font-data')||'monospace').trim() || 'monospace';
  /* LA FAMILIA DE CREMAS. Ni un tono nuevo: seis escalones interpolados en
     Lab entre los dos neutros que la página YA tiene (--crema-60 y --crema),
     declarados como tokens en :root. Medido, todos quedan entre C*=3,45 y
     C*=6,68 contra los C*=50,2 del cobre del CTA: el botón sigue siendo la
     única nota de color por un factor de 7,5 como mínimo. */
  var p = [];
  for(var i=1;i<=6;i++){
    var v = (cs.getPropertyValue('--nube-'+i)||'').trim();
    if(v) p.push(v);
  }
  if(p.length===6) paleta = p;
  /* el atlas del primer termino depende de FAM: se hornea aqui y no antes */
  hornearAtlas();
}

/* la opacidad de una partícula: el tono APLANADO por OPEXP con su piso, por la
   envolvente del encuadre vigente. Está aquí y no en línea porque hay que
   recalcularla al reencuadrar: cada encuadre disuelve por SUS cantos. */
function opacidad(t, v, E){
  var op = Math.pow(t,OPEXP);
  if(op<OPPISO) op=OPPISO; if(op>1) op=1;
  return op*env(v, E);
}
var TONO = null;

function campo(){
  /* 1 · descomprimir el mapa de tono */
  var tono = TONO = new Uint8Array(GW*GH), i=0, k, c;
  for(k=0;k<MASA.length;k++){
    c = MASA.charCodeAt(k);
    if(c>=65 && c<=80) tono[i++] = c-65;
    else i += CER.indexOf(MASA.charAt(k)) + 1;
  }
  /* 2 · muestreo por RECHAZO con peso tono^GAMA, y NO con un umbral: el alfa
     del material no es binario —62,5 % en cero, sólo 9,9 % sobre 224 y un
     22 % entre 8 y 128, que es el vestido y el desvanecido del borde— y con
     el umbral literal lo que queda no es nadie. Una CDF POR ENCUADRE: fuera
     del recorte el peso es cero. */
  function cdfDe(E){
    var c = new Float64Array(GW*GH), a = 0, cr = 0, q, gx_, gy_, uu, vv;
    var cel = 0, tin = 0;      /* celdas del recorte y cuantas llevan tinta */
    for(var j=0;j<tono.length;j++){
      gx_ = j%GW; gy_ = (j/GW)|0;
      uu = gx_/(GW-1); vv = gy_/(GH-1);
      q = Math.pow(tono[j]/15, E.gama); cr += q;
      if(uu < E.u0 || uu > E.u1 || vv < E.v0 || vv > E.v1) q = 0;
      else { cel++; if(tono[j] > 0) tin++;
             q *= env((vv - E.v0)/(E.v1 - E.v0), E); }
      a += q; c[j] = a;
    }
    return {c:c, acc:a, cru:cr, tinta: cel ? tin/cel : 1};
  }
  CDF = [];
  for(i=0;i<ENC.length;i++){ CDF.push(cdfDe(ENC[i])); TINTA[i] = CDF[i].tinta; }
  var cdf = CDF[0].c, acc = CDF[0].acc, cru = CDF[0].cru;
  /* la envolvente QUITA partículas en vez de reubicarlas: NP se reescala con
     su propia integral, así lo que se le quita al pelo y al charco se quita
     DE VERDAD y no se muda de sitio */
  NP = Math.round(NPB*acc/cru);
  var rnd = dado(20260829);
  var bruto = [];
  for(i=0;i<NP;i++){
    var r = rnd()*acc, lo=0, hi=cdf.length-1, mid;
    while(lo<hi){ mid=(lo+hi)>>1; if(cdf[mid]<r) lo=mid+1; else hi=mid; }
    var gx = lo%GW, gy = (lo/GW)|0;
    var E0 = ENC[0];
    var u = (((gx+rnd())/GW) - E0.u0)/(E0.u1-E0.u0);
    var v = (((gy+rnd())/GH) - E0.v0)/(E0.v1-E0.v0);
    var t = tono[lo]/15;
    var op = opacidad(t, v, E0);
    var z = rnd()<FRENTE ? 1 : 0;
    var q = SESGO*t + (1-SESGO)*rnd(); if(q<0)q=0; if(q>0.9999)q=0.9999;
    var j = (q*36)|0;
    var gl = rnd()<BINARIO ? (j>=18 ? '0' : '1') : GLI.charAt(j);
    var w = 0.55*t + 0.30*z + 0.15*rnd();
    var ci = Math.min(paleta.length-1, (w*paleta.length)|0);
    var de = (z && t > 0.62 && rnd() < DESTELLO) ? 1 : 0;
    bruto.push({u:u, v:v, op:op, inercia: 1.5 + (1 + rnd()*DEN - 1.5),
      gl:gl, c:ci, de:de, fa:rnd(), z:z, jx:rnd()*2-1, jy:rnd()*2-1});
  }
  /* 3 · ordenar por (destello, plano, crema, tramo de opacidad) para fijar el
     estado del contexto UNA vez por tramo en vez de 4.600 veces por cuadro */
  bruto.sort(function(a,b){
    return (a.de-b.de) || (a.z-b.z) || (a.c-b.c) ||
           ((Math.min(5,(a.op*6)|0)) - (Math.min(5,(b.op*6)|0)));
  });
  pu=new Float32Array(NP); pv=new Float32Array(NP);
  pin=new Float32Array(NP); pinl=new Float32Array(NP); pgl=new Array(NP);
  pjx=new Float32Array(NP); pjy=new Float32Array(NP);
  pxs=new Float32Array(NP); pys=new Float32Array(NP);
  pfa=new Float32Array(NP); pz=new Uint8Array(NP); pop=new Float32Array(NP);
  pmk=new Uint8Array(NP); pdx=new Float32Array(NP); pdy=new Float32Array(NP);
  tramos=[]; var clave=-1; ND=NP;
  for(i=0;i<NP;i++){
    var p=bruto[i];
    pu[i]=p.u; pv[i]=p.v; pin[i]=p.inercia;
    /* LA DELEGACIÓN VIAJA CON OTRA INERCIA, y salió de MIRARLO: con la del
       cuerpo (1..41 fotogramas, calibrada para sostener una forma) el renglón
       tardaba más de tres segundos en cuajar sobre un recorrido de ~700 px y
       en la captura salía torcido y con los pasos desiguales. Un destaque es
       un gesto DIRIGIDO, no la deriva del enjambre: 2..11 fotogramas —37 a
       183 ms— y el renglón se tiende en ~550 ms, dentro de los 500-800 ms de
       una entrada (§3). Se escala la inercia propia de cada partícula, no se
       iguala: el escalonado de llegada se conserva. */
    pinl[i]=2 + p.inercia*0.22;
    pgl[i]=p.gl; pjx[i]=p.jx; pjy[i]=p.jy; pfa[i]=p.fa; pz[i]=p.z; pop[i]=p.op;
    if(p.de){ if(ND===NP) ND=i; continue; }
    var b = Math.min(5,(p.op*6)|0), cl = (p.z*6+b)*8+p.c;
    if(cl!==clave){ tramos.push({i0:i,i1:i+1,z:p.z,c:p.c,a:0,s:0}); clave=cl; }
    else tramos[tramos.length-1].i1 = i+1;
    tramos[tramos.length-1].s += p.op;
  }
  for(i=0;i<tramos.length;i++) tramos[i].a = tramos[i].s/(tramos[i].i1-tramos[i].i0);
  elegirDelegacion();
  perfilar();
  calibrarMin();
}

/* EL PERFIL VERTICAL DE CADA ENCUADRE, y NO se recorre el mapa otra vez: la
   CDF acumulada ya integra tono x envolvente en orden de filas, así que la
   masa de la fila r es c[(r+1)*GW-1] - c[r*GW-1]. Sirve para que el primer
   término se ENCIENDA donde la cruza a ella y se apague donde no hay nadie.
   No es realismo óptico —un plano delantero no sabe qué hay detrás—: es que
   el código es SUYO. Y de paso quita la masa que no aportaba lectura, que era
   la de los muñones de columna sobre fondo vacío. */
function perfilar(){
  PERF = [];
  for(var q=0;q<CDF.length;q++){
    var c = CDF[q].c, E = ENC[q], P = new Float32Array(CERBK), mx = 0, r, b;
    for(r=0;r<GH;r++){
      var vv = r/(GH-1);
      if(vv < E.v0 || vv > E.v1) continue;
      b = (((vv-E.v0)/(E.v1-E.v0))*CERBK)|0;
      if(b<0) b=0; if(b>=CERBK) b=CERBK-1;
      P[b] += c[(r+1)*GW-1] - (r ? c[r*GW-1] : 0);
    }
    for(r=0;r<CERBK;r++) if(P[r]>mx) mx=P[r];
    if(mx>0) for(r=0;r<CERBK;r++) P[r]/=mx;
    PERF.push(P);
  }
}

/* REENCUADRAR. Lo que hace que esto se lea «recomponerse» y no como un corte:
   las partículas NO se vuelven a crear. Cada una conserva identidad, glifo,
   inercia y color, y lo único que cambia es SU DESTINO. */
function reencuadrar(idx){
  if(!CDF || idx===encActual || !pu) return;
  encActual = idx; ARa = ENC[idx].ar;
  var E = ENC[idx], D = CDF[idx], c = D.c, acc = D.acc;
  var rnd = dado(70914 + idx*7919);
  for(var i=0;i<NP;i++){
    var r = rnd()*acc, lo=0, hi=c.length-1, mid;
    while(lo<hi){ mid=(lo+hi)>>1; if(c[mid]<r) lo=mid+1; else hi=mid; }
    var gx = lo%GW, gy = (lo/GW)|0;
    pu[i] = (((gx+rnd())/GW) - E.u0)/(E.u1-E.u0);
    pv[i] = (((gy+rnd())/GH) - E.v0)/(E.v1-E.v0);
    /* LA OPACIDAD TAMBIÉN SE REENCUADRA, y esto faltaba: cada encuadre
       disuelve por SUS cantos, así que dejarla como quedó en el cuerpo entero
       le pinta al primer plano un corte duro por el pecho y le apaga la
       coronilla. Se recalcula con el tono realmente muestreado. */
    if(TONO) pop[i] = opacidad(TONO[lo]/15, pv[i], E);
  }
  /* la opacidad del tramo es la MEDIA de sus miembros: si cambian, cambia */
  for(var t=0;t<tramos.length;t++){
    var tr = tramos[t], s = 0;
    for(i=tr.i0;i<tr.i1;i++) s += pop[i];
    tr.a = s/(tr.i1-tr.i0);
  }
}

/* Un cuadro de la nube. X,Y = esquina de la caja en coordenadas de DOCUMENTO;
   W,H = su tamaño pintado; alfa = la opacidad global de la figura. */
function nube(X, Y, W, H, alfa, dt, mudo){
  var i, t, tr;
  var sy = sSuave;
  if(sembrar==='pantalla'){
    for(i=0;i<NP;i++){ pxs[i]=(pjx[i]*0.5+0.5)*LW; pys[i]=(pjy[i]*0.5+0.5)*LH; }
    sembrar=null;
  } else if(sembrar==='caja'){
    for(i=0;i<NP;i++){
      pxs[i]=X+pu[i]*W+pjx[i]*H*0.62;
      pys[i]=Y+pv[i]*H-sy+pjy[i]*H*0.62;
    }
    sembrar=null;
  }
  var uno = 16.667, x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;
  for(i=0;i<NP;i++){
    /* el destino: el cuerpo, o —si la partícula está de delegación— el
       renglón del destaque, que va en coordenadas de DOCUMENTO igual que él */
    var dx = pmk[i] ? pdx[i]      : X + pu[i]*W;
    var dy = pmk[i] ? pdy[i] - sy : Y + pv[i]*H - sy;
    if(asentar){ pxs[i]=dx; pys[i]=dy; }
    else{
      var f = 1 - Math.exp(-dt/((pmk[i]?pinl[i]:pin[i])*uno));
      pxs[i] += (dx-pxs[i])*f;
      pys[i] += (dy-pys[i])*f;
    }
    if(pxs[i]<x0)x0=pxs[i]; if(pxs[i]>x1)x1=pxs[i];
    if(pys[i]<y0)y0=pys[i]; if(pys[i]>y1)y1=pys[i];
  }
  asentar = false;
  if(mudo) return;

  /* Se borra SÓLO lo que se ensució: borrando el lienzo entero, 42 de 210
     cuadros pasaban de 20 ms en un visor de 1440x900 a densidad 2. */
  var pad = 24;
  g2.clearRect(sucio[0]-pad, sucio[1]-pad, sucio[2]-sucio[0]+2*pad, sucio[3]-sucio[1]+2*pad);
  sucio[0]=x0; sucio[1]=y0; sucio[2]=x1; sucio[3]=y1;
  if(alfa < 0.004) return;
  /* escalera geométrica del 5 % en el cuerpo del glifo: con el cuerpo
     cambiando en cada cuadro la caché de glifos de Skia no acierta nunca */
  var gb = grano(H);
  for(t=0;t<tramos.length;t++){
    tr = tramos[t];
    g2.globalAlpha = tr.a*alfa;
    g2.fillStyle = paleta[tr.c];
    /* el plano de frente NUNCA baja de 7 px: por debajo de eso un '0' es una
       mancha, y es justo la capa que existe para que el binario se lea */
    var g = tr.z ? Math.max(gb*ZOOM, 7) : gb;
    if(g >= 5){
      g2.font = '400 '+g.toFixed(2)+'px '+FAM;
      for(i=tr.i0;i<tr.i1;i++){
        if(pmk[i]) continue;              /* las de delegación van aparte */
        var x=pxs[i], y=pys[i];
        if(x<-24||x>LW+24||y<-24||y>LH+24) continue;
        g2.fillText(pgl[i], x, y);
      }
    } else {
      /* por debajo de 5 px un '0' no es un dígito, es un punto: rectángulo,
         y CLAVADO en la rejilla del dispositivo o la figura sale lechosa */
      var s = Math.max(1, Math.round(g*0.66*DPR))/DPR, m2 = s*0.5;
      for(i=tr.i0;i<tr.i1;i++){
        var x2=pxs[i], y2=pys[i];
        if(x2<-24||x2>LW+24||y2<-24||y2>LH+24) continue;
        g2.fillRect(Math.round((x2-m2)*DPR)/DPR, Math.round((y2-m2)*DPR)/DPR, s, s);
      }
    }
  }
  /* EL RENGLÓN DEL DESTAQUE, en pasada aparte y por dos razones medidas. (1)
     El CUERPO: dibujado con el de la figura salía a 7 px debajo de un titular
     de 36 px y no se leía como un subrayado, se leía como suciedad; aquí lo
     manda el TÉRMINO —un tercio de su cuerpo, entre 7 y 13 px—, que es como
     se dimensiona un subrayado. (2) El ALFA: la figura entera va multiplicada
     por la ganancia ALFA=0,40 para no comerse al CTA, y un destaque a 0,40 no
     destaca nada; el renglón son unas decenas de glifos y su masa luminosa es
     despreciable, así que sube a 0,85 de la opacidad viva. */
  if(luzEl && LUZG > 0 && alfa > 0.004){
    g2.font = '400 '+LUZG.toFixed(2)+'px '+FAM;
    g2.fillStyle = paleta[paleta.length-2];
    g2.globalAlpha = Math.min(1, alfa/ALFA*0.85);
    for(i=0;i<deleg.length;i++){
      var dj = deleg[i]; if(!pmk[dj]) continue;
      var xl=pxs[dj], yl=pys[dj];
      if(xl<-24||xl>LW+24||yl<-24||yl>LH+24) continue;
      g2.fillText(pgl[dj], xl, yl);
    }
  }
  /* LOS DESTELLOS, en pasada aparte: cada uno lleva su alfa y su cuerpo. Tres
     seguros contra el parpadeo de discoteca: sólo destellan partículas claras
     y de frente, el período es largo y distinto en cada una (5,3-9,7 s), y la
     curva es sin^8 —un pico estrecho, ~0,98 s por encima de media altura—. Y
     como el brillo no puede subir (la crema ya vale Y=0,80 contra Y=0,26 del
     cobre), lo que hace legible la chispa es que FLOREZCA: +90 % de cuerpo. */
  if(ND < NP){
    var faseT = reducido ? 0 : reloj/1000;
    g2.fillStyle = paleta[paleta.length-1];
    var cuerpoP = -1, base = Math.max(gb*ZOOM, 7);
    for(i=ND;i<NP;i++){
      var xd=pxs[i], yd=pys[i];
      if(xd<-24||xd>LW+24||yd<-24||yd>LH+24) continue;
      var se = Math.sin(6.283185*(pfa[i] + faseT/(5.3+4.4*pfa[i])));
      if(se<0) se=0;
      var br = se*se; br=br*br; br=br*br;
      g2.globalAlpha = (pop[i] + (1-pop[i])*br)*alfa;
      var gd = Math.exp(Math.round(Math.log(base*(1+0.90*br))/0.04879)*0.04879);
      if(gd !== cuerpoP){ g2.font = '400 '+gd.toFixed(2)+'px '+FAM; cuerpoP = gd; }
      g2.fillText(pgl[i], xd, yd);
    }
  }
  g2.globalAlpha = 1;

  /* EL PRIMER TERMINO, y va aqui por una razon y no por orden de lectura:
     se dibuja DESPUES de toda la figura porque la oclusion ES la senal de
     profundidad. Su rectangulo se une al sucio o el borrado parcial deja
     rastro: el estrato sale de la caja del enjambre por el radio del glifo. */
  var rc = cerca(X, Y-sy, W, H, alfa, gb);
  if(rc){
    if(rc[0]<sucio[0])sucio[0]=rc[0]; if(rc[1]<sucio[1])sucio[1]=rc[1];
    if(rc[2]>sucio[2])sucio[2]=rc[2]; if(rc[3]>sucio[3])sucio[3]=rc[3];
  }
}

/* ==================================================================
   D · EL PRIMER TÉRMINO — «que esté en un plano distinto, que juegue
   a través del código»

   DE DÓNDE SALE, Y NO DE UNA INTUICIÓN. Medida la referencia que entregó
   Sebastián («Esta es CompAI.mp4», 1280x720, 24 fps) contra mi pieza con el
   MISMO código (`planos.py`), sobre dos fotogramas consecutivos:

                        referencia        mi pieza (antes)
     relleno fig/campo     3,58x              3,68x
     luz p90 fig/campo     2,75x              6,54x
     parpadeo fig/campo    0,37x              0,37x
     paso de rejilla    10x14 / 35x32      38x38 / 38x34

   O sea: en los tres índices que yo tenía, ya estaba. Lo que NO estaba lo
   dice el suelo del fotograma — referencia 19,9/255, mi pieza 1,14/255. En la
   referencia ella está DENTRO de un campo de código que existe por todas
   partes; en la mía el campo es negro y ella flota en el vacío. No se puede
   estar «en otro plano» cuando sólo hay un plano. Y las dos hipótesis que
   traía de mirar el vídeo salieron FALSAS al medirlas, y quedan escritas para
   que nadie las repita: (1) no se separa por movimiento —el mejor
   desplazamiento vertical es 0 px/fotograma en la figura Y en el campo: la
   lluvia no traslada, parpadea en su sitio—; (2) no hay aura —la luz del
   campo es plana a cualquier distancia de la silueta, 30,8 a 33,9 sobre 255—.

   LO QUE SÍ HACE LA REFERENCIA, y es lo único accionable: la rejilla de
   columnas del campo ATRAVIESA la cara. Medido dentro del rostro, 15 de 220
   columnas caen bajo el 60 % de la mediana y el perfil horizontal va de 122,8
   a 38,7 (min/max 0,32). Ella no está pintada ENCIMA del código: el código le
   pasa por delante y por detrás.

   ASÍ QUE LA PROFUNDIDAD SE CONSTRUYE CON UN TERCER ESTRATO, no subiéndole el
   brillo a ella. Cuatro señales que apuntan al mismo sitio, que es lo que
   hace que el ojo no dude:
     1 OCLUSIÓN  · las columnas se dibujan DESPUÉS que ella y más claras. Lo
                   que tapa está delante; no hay señal más barata ni más firme.
     2 ESCALA    · cuerpo CERG veces el del plano de frente de la figura.
     3 PARALAJE  · el fondo (#bg) es position:fixed y no se mueve nunca; ella
                   va 1:1 con el documento; esto va a 1+CERPAR. Tres
                   velocidades, tres planos, y se puede medir en píxeles.
     4 FOCO      · desenfocadas. Un primer término fuera de foco es LA figura
                   retórica del cine para decir «esto está más cerca», y es lo
                   que separa una pieza cara de un montón de puntos.

   POR QUÉ VIVE DENTRO DE LA CAJA DE LA FIGURA Y NO POR TODA LA PÁGINA: el
   hueco lo firma el buscador de huecos, y ese contrato dice que la agente no
   pisa el texto de VisuAI. Un campo de código a página completa sería
   rediseñar su composición, que no es mi terreno. Recortado a su caja, el
   primer término no puede invadir nada — y además es más fiel al encargo: el
   código juega CON ELLA, no decora la página.

   EL DESENFOQUE SE HORNEA UNA VEZ. `ctx.filter='blur()'` por glifo y por
   cuadro es caro; aquí se pinta un atlas de CERGL glifos a cuerpo fijo con el
   desenfoque puesto, y por cuadro sólo hay drawImage. Si el navegador no
   soporta filter, el atlas sale nítido: pierde una de las cuatro señales y
   conserva tres. Degrada, no se rompe.
   ================================================================== */
var CERG   = 1.55;   /* cuerpo, en múltiplos del plano de frente de la figura */
var CERA   = 0.0;   /* alfa del estrato, sobre la opacidad viva de la figura.
                        APAGADO el 31-ago y NO por gusto: MIRADO el sitio
                        publicado, el estrato borraba a la figura. Medido con
                        `silueta.py` dentro de la caja -tinta del mapa contra
                        no-tinta-, el cociente pasa de 4,55 a 11,93 y la
                        correlacion con el mapa de 0,584 a 0,653 al apagarlo.
                        `planos.py` no lo veia porque comparaba la figura con
                        el campo de FUERA de su caja. Y contradecia mi propia
                        medicion del 30-ago sobre la referencia: alli figura y
                        campo llevan el MISMO grano (10x14 contra 11x16) y no
                        hay separacion por escala; este estrato la separaba
                        4,7:1. Volver a encenderlo es cambiar este 0.0.       */
var CERV   = 26;     /* px/s de caída, antes del reparto por columna          */
var CERPAR = 0.34;   /* paralaje EXTRA sobre el 1:1 del documento             */
var CERB   = 0.075;  /* desenfoque MAXIMO, en cuerpos: solo la columna mas
                        cercana lo lleva entero. Plano y a 0,09 ya se leia como
                        cristal sucio; medido mirando, no razonando.          */
var CERNIV = 3;      /* niveles de foco horneados en el atlas                 */
var CERESP = 2.1;   /* separación entre glifos de una columna, en cuerpos    */
var CERANC = 60;     /* px de caja por columna: cuántas caben                 */
var CERHUE = 0.08;   /* el HUECO CENTRAL, en fracción de media caja. Ver abajo */
var CERBK  = 32;     /* cubos del perfil vertical de la figura                */
var CERPISO= 0.22;   /* cuánto queda del estrato donde ella NO está           */
var CERGL  = '01';   /* el primer término es binario y nada más: a este cuerpo
                        una letra se lee como palabra y compite con el titular */
var CERS0  = 40;     /* cuerpo del atlas horneado, en px                      */
var CERJ   = 26;     /* glifos por columna: cubre cualquier caja con margen   */

var atlas = null, atlasC = 0, atlasNit = false, PERF = null;
function hornearAtlas(){
  if(CERA <= 0){ atlas = null; return; }
  var C = Math.ceil(CERS0*2.4);
  var cv = document.createElement('canvas');
  cv.width = C*CERGL.length; cv.height = C*CERNIV;
  var g = cv.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  atlasNit = false;
  /* una FILA por nivel de foco: 0 = nítido (fondo del estrato), el último =
     CERB entero (la columna más cercana). Se hornea una vez y por cuadro sólo
     hay drawImage; `ctx.filter` por glifo y por cuadro no cabe en presupuesto. */
  for(var n=0;n<CERNIV;n++){
    var rad = CERS0*CERB*n/(CERNIV-1);
    var quiere = rad > 0.01 ? 'blur('+rad.toFixed(2)+'px)' : 'none';
    g.filter = quiere;
    if(rad > 0.01 && g.filter !== quiere) atlasNit = true;   /* sin soporte: nítido, no roto */
    g.font = '400 '+CERS0+'px '+FAM;
    for(var i=0;i<CERGL.length;i++) g.fillText(CERGL.charAt(i), C*i+C/2, C*n+C/2);
  }
  g.filter = 'none';
  atlas = cv; atlasC = C;
}

/* Estado de las columnas. Se rehace al cambiar la caja de la figura, NO por
   cuadro: una columna es un objeto estable; re-sortearla cada cuadro se ve
   como ruido y no como un plano. */
var cerX=[], cerV=[], cerA=[], cerF=[], cerG=[], cerZ=[], cerN=0, cerW=-1;
function tallarCerca(W){
  var n = Math.round(W/CERANC); if(n<3) n=3; if(n>12) n=12;
  if(n===cerN && Math.abs(W-cerW)<1) return;
  cerN = n; cerW = W;
  var r = dado(31071977);
  cerX=[]; cerV=[]; cerA=[]; cerF=[]; cerG=[]; cerZ=[];
  /* EL HUECO CENTRAL, y sale de mirar el render con tres columnas: la del
     medio caía sobre el eje de la figura y no se leía como código pasando por
     delante, se leía como una BARRA que la parte por la cara. Un primer
     término que destruye al sujeto es lo contrario de «que se note su
     presencia». Las columnas se reparten desde el canto hacia dentro y paran
     a CERHUE de media caja del eje; el centro queda libre.
     Y la hondura ya no se sortea: va con la posición. La columna más INTERIOR
     es la más cercana —la más desenfocada y la más tenue—, así que lo que roza
     a la figura es una mancha blanda, y el código nítido la enmarca. */
  var mitad = Math.max(1, Math.ceil(n/2)-1);
  for(var i=0;i<n;i++){
    var lado = (i%2) ? 1 : -1;
    var rango = ((i>>1)/mitad);                 /* 0 = interior, 1 = canto */
    cerX.push(0.5 + lado*(CERHUE + (0.48-CERHUE)*rango) + (r()-0.5)*0.05);
    cerV.push(0.62 + r()*0.95);        /* cada columna a su velocidad     */
    cerF.push(r());                    /* y a su fase                     */
    /* LA HONDURA VA AL REVÉS DE LO QUE PROBÉ PRIMERO, y lo decidió el render.
       Con las columnas interiores desenfocadas, las manchas blandas caían
       sobre su cara y se leían como SUCIEDAD. Van al canto: el desenfoque de
       primer término vive en el margen del cuadro —que es donde el cine lo
       pone— y lo que le cruza a ella va nítido, que es lo que se lee como
       código y no como mugre. Un 40 % de sorteo desordena el patrón. */
    var z = (rango*0.92)*0.60 + r()*0.40;
    cerZ.push(z);
    cerA.push(1.05 - 0.35*z);
    var s = '';
    for(var j=0;j<CERJ;j++) s += (r()<0.5?0:1);
    cerG.push(s);
  }
}

/* Dibuja el estrato cercano. X,Y,W,H = la caja de la figura EN PANTALLA.
   Devuelve el rectángulo ensuciado para que el borrado parcial lo cubra. */
function cerca(X, Y, W, H, alfa, gb){
  /* con CERA en 0 el bucle seguia haciendo un drawImage por glifo a
     globalAlpha 0: invisible y pagado igual. La puerta va aqui. */
  if(!atlas || alfa < 0.004 || CERA <= 0) return null;
  tallarCerca(W);
  var g0 = Math.max(gb*ZOOM, 7)*CERG;
  var span0 = H + g0*CERESP*2;
  /* el paralaje va sobre el scroll SUAVIZADO, el mismo que usa la figura: con
     uno por el crudo y otro por el suavizado, el estrato tiembla contra ella
     en cada rueda de ratón */
  /* EL SIGNO DEL PARALAJE, y estaba al reves hasta que lo medi. Al sumar,
     bajar la pagina RETRASA el estrato: se movia MENOS que ella, o sea se leia
     como mas LEJOS, justo lo contrario de lo que existe para decir. Va restado:
     mas rapido que el documento = mas cerca que ella. */
  var fase = (reducido ? 0 : reloj/1000)*CERV - sSuave*CERPAR;
  var borde = H*0.16;                  /* entra y sale fundida, nunca aparece */
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9, i, j;
  for(i=0;i<cerN;i++){
    var x = X + cerX[i]*W;
    var g = g0*(0.78 + 0.44*cerZ[i]);
    var d = atlasC*(g/CERS0), m = d*0.5;
    var niv = Math.min(CERNIV-1, (cerZ[i]*CERNIV)|0);
    var sep = g*CERESP;
    var span = H + sep*2;
    var off = (fase*cerV[i] + cerF[i]*span0) % span;
    if(off<0) off += span;
    for(j=0;j<CERJ;j++){
      var y = Y - sep + ((off + j*sep) % span);
      var rel = y - Y, f = 1;
      if(rel < borde) f = sat(rel/borde);
      else if(rel > H-borde) f = sat((H-rel)/borde);
      if(PERF){
        var bq = (rel/H*CERBK)|0; if(bq<0) bq=0; if(bq>=CERBK) bq=CERBK-1;
        f *= CERPISO + (1-CERPISO)*PERF[encActual][bq];
      }
      if(f <= 0.02) continue;
      if(x<-d||x>LW+d||y<-d||y>LH+d) continue;
      g2.globalAlpha = alfa*CERA*cerA[i]*f;
      g2.drawImage(atlas, atlasC*(+cerG[i].charAt(j)), atlasC*niv, atlasC, atlasC,
                   x-m, y-m, d, d);
      if(x-m<x0)x0=x-m; if(x+m>x1)x1=x+m;
      if(y-m<y0)y0=y-m; if(y+m>y1)y1=y+m;
    }
  }
  g2.globalAlpha = 1;
  return x1>x0 ? [x0,y0,x1,y1] : null;
}

/* ==================================================================
   F · EL DESTAQUE — «destacando algo con las mismas partículas y/o
   códigos». Es una FUNCIÓN, no un adorno, así que queda definida:

     QUÉ   · un término por sección, el que carga el dato verificable de esa
             sección. Va marcado en el HTML con data-luz y CUÁL es lo decide
             VisuAI: el atributo es el único sitio donde se cambia.
     CUÁNDO· cuando ella YA está asentada en la sección (opacidad >= 0,90) y
             DESPUÉS de un retardo, no a la vez: se encadena, no se
             sincroniza. Si tres cosas entran juntas, es una sola cosa (§3).
     CÓMO  · una delegación de SUS PROPIAS partículas —del plano de frente,
             que es el que se lee como binario— cambia de destino y se tiende
             en fila bajo el término. Conservan glifo, inercia, crema y
             destello, así que llegan escalonadas y siguen respirando. Ni una
             partícula nueva, ni un elemento nuevo en el DOM.
     VUELTA· al cambiar de sección recuperan su destino en el cuerpo con su
             propia inercia: el renglón se deshace HACIA ella, no se apaga.
     QUIETO· con movimiento reducido se dibuja ya asentado y se queda. Quieto
             no es ausente.
   ================================================================== */
var LUZFR = 0.075;            /* fracción del enjambre que va de delegación */
var LUZESP = 0.78;            /* paso entre glifos, en cuerpos              */
var LUZRET = 520;             /* el retardo, en ms, desde que ella cuaja    */
var deleg = [], luzEl = null, LUZG = 0;

function elegirDelegacion(){
  /* del plano de FRENTE y sin los destellos: es la capa que se lee como
     binario, y sacarle ~10 % no le quita cuerpo a la figura */
  var cand = [];
  for(var i=0;i<ND;i++) if(pz[i]) cand.push(i);
  var n = Math.min(cand.length, Math.max(10, Math.round(NP*LUZFR)));
  deleg = [];
  if(!cand.length) return;
  var paso_ = cand.length/n;
  for(var j=0;j<n;j++) deleg.push(cand[Math.min(cand.length-1,Math.floor(j*paso_))]);
}

/* el canto inferior de la TINTA del término, no el de su caja de línea: se
   compone la línea base con las métricas de la fuente y se le suma el
   descendente real del texto medido. Sin esto el renglón se mete entre los
   descendentes. */
function cantoTinta(el, r){
  var cs = getComputedStyle(el);
  var fs = parseFloat(cs.fontSize) || 14;
  /* el cuerpo del renglón lo manda el TÉRMINO, no la figura */
  LUZG = Math.max(7, Math.min(13, fs*0.34));
  var cv = cantoTinta._c || (cantoTinta._c = document.createElement('canvas').getContext('2d'));
  cv.font = cs.fontStyle+' '+cs.fontWeight+' '+fs+'px '+cs.fontFamily;
  var m = cv.measureText(el.textContent || 'Hg');
  var asc = m.fontBoundingBoxAscent || fs*0.80;
  var des = m.fontBoundingBoxDescent || fs*0.20;
  var tinta = (m.actualBoundingBoxDescent !== undefined) ? m.actualBoundingBoxDescent : fs*0.16;
  /* la línea base dentro de la caja de línea: media interlínea + ascendente */
  var base = r.top + (r.height - (asc+des))/2 + asc;
  return base + Math.max(tinta, 0) + 3;
}

function ponerLuz(el){
  if(!deleg.length) return;
  var i;
  if(!el){
    for(i=0;i<deleg.length;i++) pmk[deleg[i]] = 0;
    luzEl = null; LUZG = 0;
    return;
  }
  var rg = document.createRange();
  rg.selectNodeContents(el);
  var rs = rg.getClientRects();
  if(!rs.length){ ponerLuz(null); return; }
  var r = rs[0];                       /* términos de una sola línea */
  var sx = window.pageXOffset, sy = window.pageYOffset;
  var y = cantoTinta(el, r) + sy;      /* fija LUZG con el cuerpo del término */
  var n = Math.max(6, Math.min(deleg.length, Math.round(r.width/(LUZG*LUZESP))));
  for(i=0;i<deleg.length;i++){
    var d = deleg[i];
    if(i < n){
      pmk[d] = 1;
      pdx[d] = r.left + sx + (i+0.5)*(r.width/n);
      pdy[d] = y;
    } else pmk[d] = 0;
  }
  luzEl = el;
}

/* ==================================================================
   G · LA REVERENCIA DE SALUDO
   No hay pose inclinada en el material —es un recorte frontal— así que la
   reverencia se resuelve por lo que SÍ ocurre de frente cuando alguien se
   inclina: el ESCORZO. La caja se comprime en vertical con el pivote ABAJO
   —el canto que no se mueve— y la figura baja unos píxeles. La cabeza recorre
   todo el gesto y los pies nada, que es el reparto exacto de una reverencia
   vista de frente. Ni una partícula nueva y ni un píxel fuera de su hueco:
   el descenso está topado por debajo del espacio personal del buscador.
   Con anticipación —10 % del recorrido hacia ARRIBA antes de bajar— y con
   sobrepaso a la vuelta. 940 ms en total: por debajo del segundo (§3). */
/* P2 (CinemAI 4-sep): `?rev=N` escala las cuatro fases; `?rev=0` la saca.
   Con CREV=0, REV.fin=0 y `reverencia()` devuelve 0 en todo momento, asi
   que u=0 y las tres deformaciones (REVQ/REVW/REVY) se multiplican por
   cero: no queda gesto residual, y la levitacion arranca en cuanto cuaja. */
var REV = {ant:90*CREV, baja:320*CREV, sos:140*CREV, sube:390*CREV};
REV.fin = REV.ant + REV.baja + REV.sos + REV.sube;
/* REVQ escorzo vertical · REVW la ANCHURA, que es la mitad que faltaba: de
   frente, inclinarse acerca la cabeza a la cámara, así que la caja se comprime
   en alto Y se ensancha un poco. Sin eso el gesto se leía como que la nube
   «respira hacia abajo»; con eso se lee que viene hacia ti. REVY es el
   descenso, topado en 10 px para no salirse nunca del hueco (el espacio
   personal del buscador es de 14 px como mínimo). */
var REVQ = 0.200, REVW = 0.050, REVY = 0.055, REVTOPE = 10;
var revT = -1;
function reverencia(t){
  /* P6 (CinemAI 4-sep): CON LA REVERENCIA SACADA TODAS LAS FASES MIDEN CERO y
     la ultima linea hacia `1 - MICRO(0/0)`, o sea NaN. UN SOLO cuadro con
     u=NaN vuelve NaN la caja de la figura y con ella el destino de las 4.401
     particulas: la figura DESAPARECE y no vuelve nunca, SIN UN SOLO ERROR en
     consola. No se ve leyendo el codigo; se vio en el render, y se confirmo
     con `__viva.nube()` devolviendo medio:null y enVuelo:0 contra 4.401.
     Es un defecto que introdujo P2 al hacer gobernables las duraciones: una
     division por cero escondida en una duracion. */
  if(!(REV.fin > 0)) return 0;
  if(t < 0 || t > REV.fin) return 0;
  if(t < REV.ant) return -0.10*Math.sin(Math.PI*(t/REV.ant));
  if(t < REV.ant+REV.baja) return ENTRA((t-REV.ant)/REV.baja);
  if(t < REV.ant+REV.baja+REV.sos) return 1;
  return 1 - MICRO((t-REV.ant-REV.baja-REV.sos)/REV.sube);
}

/* LENTAMENTE — las mayúsculas son de Sebastián. No se toca la inercia de cada
   partícula, que es lo que hace que la nube cuaje DESIGUAL: se DILATA EL
   TIEMPO del enjambre. dt_nube = dt·RITMO(t) con RITMO subiendo de LENTO0 a 1.
   Escalar dt escala todas las constantes de tiempo por igual, así que el
   reparto desigual del cuaje queda intacto y sólo cambia la velocidad.
   Es la única duración de la pieza por encima del segundo, y es un encargo
   literal: la recomposición es una materialización, no un micro-gesto. */
var LENTO0 = 0.18, LENTOT = 2900*CLENTO;   /* P2 */
/* cuándo se considera cuajada: distancia media al destino por debajo de este
   umbral. Se MIDE, no se cronometra a ojo, y hay un tope duro por si no llega. */
var CUAJE = 3.0, CUAJEMAX = 6400*Math.max(1, CLENTO);   /* P3 */

function residuo(X,Y,W,H){
  var s=0, n=0;
  for(var i=0;i<NP;i+=8){
    var dx = (pmk[i]?pdx[i]:X+pu[i]*W) - pxs[i];
    var dy = (pmk[i]?pdy[i]-sSuave:Y+pv[i]*H-sSuave) - pys[i];
    s += Math.abs(dx)+Math.abs(dy); n++;
  }
  return n ? s/n : 0;
}

/* ==================================================================
   H · EL RELOJ
   ================================================================== */
var reloj = 0, previo = 0, congelado = null;
var m = /[?&#]t=(\d+)/.exec(location.href);
if(m) congelado = +m[1];

/* Escribir el MISMO valor en style invalida igual: se escribe sólo cuando
   el valor cambia. */
function poner(el, prop, val){
  var c = el.__c || (el.__c = {});
  if(c[prop] === val) return;
  c[prop] = val; el.style[prop] = val;
}

function paso(dt, mudo){
  reloj += dt;

  if(reducido){ sSuave = window.pageYOffset; asentar = true; }
  else sSuave += (window.pageYOffset - sSuave)*(1-Math.exp(-dt/158));

  var s = elegir();
  var p = s ? s.pos : null;
  if(p !== destino){
    if(!p){ pendiente=null; destino=null; seccion=null; fundir(0,220,SALE); ponerLuz(null); }
    else if(destino && ca>0.05 && p.enc===encActual &&
             libre({x:cx,y:cy,w:baseH*ARa,h:baseH}, p)){
      /* mismo encuadre y corredor libre: DESLIZA */
      reescalar(p.h); tx=p.x; ty=p.y; destino=p; seccion=s; pendiente=null;
      fundir(1,420,ENTRA); tLlego=reloj; ponerLuz(null);
    } else {
      pendiente = p; destino = p; seccion = s; fundir(0,200,SALE); ponerLuz(null);
    }
  }
  if(pendiente && ca < 0.03){
    reencuadrar(pendiente.enc||0);
    reescalar(pendiente.h); cx=tx=pendiente.x; cy=ty=pendiente.y; k=1;
    /* cuando el corredor no está libre la figura NO viaja: se deshace y se
       rehace en el sitio nuevo. Con partículas eso no es un fundido: el
       enjambre se esparce alrededor del hueco y vuelve a cuajar. */
    if(!reducido) sembrar='caja';
    pendiente=null; fundir(1,620,ENTRA); tLlego=reloj;
  }
  if(!pendiente && destino){
    var f = 1 - Math.exp(-dt/190);
    cx += (tx-cx)*f; cy += (ty-cy)*f;
    k  += (1-k)*(1-Math.exp(-dt/210));
  }
  if(fa){
    var pf = sat((reloj-fa.t0)/fa.d);
    ca = fa.de + (fa.a-fa.de)*fa.c(pf);
    if(pf>=1) fa=null;
  }

  /* levitar: deriva mínima de dos períodos primos entre sí, para que nunca se
     repita a la vista. Nada de cadencia de paso, nada de inclinación. */
  var lx=0, ly=0, lo=1;
  /* MIENTRAS SE PRESENTA, NO LEVITA, y esto no es gusto: la levitación mueve
     el destino a ~13 px/s y con constantes de tiempo de hasta 683 ms el
     enjambre arrastra un retraso permanente —medido, 3,08 px de residuo medio
     que no bajaba nunca—, así que el criterio de «ya cuajó» no se podía
     cumplir jamás. Con el destino quieto el residuo sí baja a cero. Y de paso
     el relato es el correcto: se materializa, saluda, y ENTONCES respira. */
  var lev = (modo==='saludo') ? (revT<0 ? 0 : sat((reloj-(revT+REV.fin))/700)) : 1;
  if(!reducido && ca>0.05 && lev>0){
    lx = lev*2.2*Math.sin(reloj/4100*6.283185);
    ly = lev*5.5*Math.sin(reloj/2600*6.283185);
    lo = 1 - lev*(0.06 - 0.06*Math.sin(reloj/3300*6.283185));
  }
  /* la escala se ESCALONA en una escalera geométrica del 1 %: con la escala
     variando de continuo Chrome vuelve a rasterizar en casi cada fotograma */
  var kq = Math.exp(Math.round(Math.log(k)/0.00995)*0.00995);
  var Wb = baseH*ARa*kq, Hb = baseH*kq;
  var Xb = cx+lx, Yb = cy+ly;

  /* LA PRESENTACIÓN: el tiempo dilatado y, cuando está cuajada, la reverencia */
  var dtn = dt;
  if(modo === 'saludo'){
    dtn = dt*(LENTO0 + (1-LENTO0)*RITMO(sat(reloj/LENTOT)));
    if(revT < 0 && reloj > 900 &&
       (residuo(Xb,Yb,Wb,Hb) < CUAJE || reloj > CUAJEMAX)) revT = reloj;
    if(revT >= 0 && reloj > revT + REV.fin){ modo='vivo'; tLlego=reloj; }
  }

  var u = (revT>=0) ? reverencia(reloj-revT) : 0;
  var Hr = Hb*(1-REVQ*u);
  var Wr = Wb*(1+REVW*u);
  var Yr = Yb + (Hb-Hr) + Math.min(Hb*REVY, REVTOPE)*u;   /* pivote ABAJO */
  var Xr = Xb - (Wr-Wb)/2;                                /* y centrado */

  poner(fig,'transform','translate3d('+Xb.toFixed(2)+'px,'+Yb.toFixed(2)+'px,0) scale('+kq.toFixed(5)+')');
  poner(fig,'opacity',(ca*lo).toFixed(3));

  /* el destaque: encadenado, nunca simultáneo con su llegada */
  var quiere = (destino && seccion && seccion.luz && ca>=0.90 &&
                (reloj-tLlego) > LUZRET && modo!=='saludo') ? seccion.luz : null;
  if(quiere !== luzEl) ponerLuz(quiere);

  nube(Xr, Yr, Wr, Hr, ca*lo*ALFA, dtn, mudo);
}

var listo = false;
function marco(ts){
  var dt = previo ? Math.min(64, ts-previo) : 16; previo = ts;
  if(congelado !== null){
    if(!listo){
      var n = Math.round(congelado/16.667), i;
      paso(0, true);
      for(i=0;i<n;i++) paso(16.667, i < n-1);   /* sólo se PINTA el último */
      listo = true;
    }
  } else paso(dt, false);
  requestAnimationFrame(marco);
}

/* ==================================================================
   I · ARRANQUE
   ================================================================== */
function reponer(){
  tallar(); medir();
  var s = elegir(), p = s?s.pos:null;
  /* FALTABA `reencuadrar`, y es un fallo real que se ve al cruzar los 980 px
     redimensionando: la columna colapsa, el hueco cambia de forma y de
     encuadre, pero como `reponer` fija `destino=p` a mano, `paso` nunca ve el
     cambio y la figura sigue pintandose con el ar y la CDF del encuadre
     anterior -o sea, estirada, y SIN UN SOLO ERROR-. `arrancar` si lo hacia;
     el camino del resize no. */
  if(p){ reencuadrar(p.enc||0); reescalar(p.h); cx=tx=p.x; cy=ty=p.y; destino=p; seccion=s; k=1; }
  if(luzEl) ponerLuz(luzEl);
}

function arrancar(){
  tallar(); campo(); medir();
  sSuave = window.pageYOffset;
  var s = elegir(), p = s?s.pos:null;
  if(reducido){
    /* EL PLEXUS TAMBIÉN SE PARA, y es un defecto real que la auditoría
       encontró: `animation:none` y `transition:none` no detienen un <video>.
       Medido con movimiento reducido, la página movía 66.444 píxeles en 2,5 s
       con la nube ya quieta — todo el vídeo de fondo. Se pausa y queda su
       fotograma, que es exactamente lo que pide quien pide menos movimiento. */
    var vs = document.querySelectorAll('video');
    for(var q=0;q<vs.length;q++){ try{ vs[q].pause(); }catch(e){} }
    /* quieto NO es ausente: la nube se dibuja YA CUAJADA en su sitio, y el
       destaque también. Dibujar antes de converger dejaría la figura
       congelada en la nube del arranque, que es el bug del 24-ago del revés. */
    modo='vivo'; destino=p; seccion=s; sembrar=null; asentar=true;
    if(p){ reencuadrar(p.enc||0); reescalar(p.h); cx=tx=p.x; cy=ty=p.y; k=1; ca=0.94; }
    if(s && s.luz) ponerLuz(s.luz);
    requestAnimationFrame(marco);
    return;
  }
  /* la nube arranca repartida por TODA la pantalla y se recompone LENTAMENTE */
  sembrar='pantalla';
  modo='saludo'; destino=p; seccion=s;
  if(p){ reencuadrar(p.enc||0); reescalar(p.h); cx=tx=p.x; cy=ty=p.y; k=1; }
  ca=0; fundir(1, 900, ENTRA);
  requestAnimationFrame(marco);
  /* SI EL VISITANTE SE MUEVE, LA PRESENTACIÓN SE ACABA. No es cortesía: si
     baja, el enjambre se re-siembra en el hueco nuevo, el residuo se dispara y
     el criterio de «ya cuajó» no se cumple hasta el tope duro — la agente se
     quedaba sin levitar y sin destacar nada durante seis segundos. La
     reverencia es un saludo al entrar; a quien ya entró no se le saluda. */
  ['wheel','touchstart','keydown','pointerdown','scroll'].forEach(function(ev){
    addEventListener(ev, function(){ if(modo==='saludo'){ modo='vivo'; tLlego=reloj; } },
                     {passive:true, once:true});
  });
}

var tRes;
addEventListener('resize', function(){ clearTimeout(tRes); tRes=setTimeout(reponer,150); });
if(document.readyState === 'complete') arrancar();
else addEventListener('load', arrancar);

/* gancho de verificación: la auditoría no le cree a estos números, mide el
   DOM por su cuenta; esto sólo sirve para inspeccionar en vivo */
window.__viva = {
  enc:function(){return {i:encActual, n:ENC[encActual].n, ar:ARa,
     tinta:+TINTA[encActual].toFixed(4), gb:+grano(baseH*k).toFixed(2),
     gama:ENC[encActual].gama};},
  modo:function(){return {modo:modo, reloj:Math.round(reloj), revT:Math.round(revT), alfa:+ca.toFixed(3)};},
  secciones:function(){return secciones.map(function(q){
     return {id:q.el.id||q.el.className, top:Math.round(q.top), bot:Math.round(q.bot),
             pos:q.pos?{x:Math.round(q.pos.x),y:Math.round(q.pos.y),w:Math.round(q.pos.w),
                        h:Math.round(q.pos.h),enc:ENC[q.pos.enc].n}:null,
             luz:q.luz?q.luz.textContent:null,
             hueco:q.bs?q.bs.map(function(b,z){ return b ? {n:ENC[z].n,
                w:Math.round(b.w), h:Math.round(b.h),
                da:Math.round(Math.min(b.cabe*0.88, innerHeight*0.68, 640)),
                pide:ENC[z].min} : null;}) : null};});},
  ocupados:function(){return ocupados;},
  /* la puerta de dignidad, para que la verificacion lea LOS MISMOS numeros
     que decide el motor y no una copia mia en Python */
  puerta:function(){return {gbmin:GBMIN, hdr:techo(), NP:NP,
     min:ENC.map(function(E,q){return {n:E.n, min:E.min, ar:+E.ar.toFixed(4),
        tinta:+TINTA[q].toFixed(4)};})};},
  luz:function(){var n=0;for(var i=0;i<NP;i++) if(pmk[i])n++;
     return {el:luzEl?luzEl.textContent:null, delegadas:n, deNP:NP};},
  destellos:function(){
    var n=NP-ND, enc=0, i, faseT=reducido?0:reloj/1000, s=0;
    for(i=ND;i<NP;i++){
      var se=Math.sin(6.283185*(pfa[i]+faseT/(5.3+4.4*pfa[i]))); if(se<0)se=0;
      var br=se*se; br=br*br; br=br*br;
      if(br>0.5) enc++;
      s += (1-pop[i])*br;
    }
    return {candidatas:n, deNP:NP, encendidas:enc, ganancia:s};},
  nube:function(){
    var X=cx, Y=cy, W=baseH*ARa*k, H=baseH*k, i, n=0, ex=0, s=0;
    for(i=0;i<NP;i++){
      var dx=(pmk[i]?pdx[i]:X+pu[i]*W)-pxs[i], dy=(pmk[i]?pdy[i]-sSuave:Y+pv[i]*H-sSuave)-pys[i];
      var d=Math.sqrt(dx*dx+dy*dy); s+=d;
      if(!pmk[i]){
        var fx=pxs[i], fy=pys[i]+sSuave;
        var e=Math.max(X-fx, fx-(X+W), Y-fy, fy-(Y+H));
        if(e>ex) ex=e;
      }
      if(d>0.5) n++;
    }
    return {medio:s/NP, enVuelo:n, excursion:ex, caja:[X,Y,W,H], alfa:ca, NP:NP};}
};
})();
