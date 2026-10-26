/* SOUL · datos del cuestionario. Texto y orden tal cual el diseño aprobado (Paso00..Paso20). */
(function (W) {
const PLANS = [
  { label: 'fresh', desc: 'Una página · 10 preguntas', price: '$9.990 al mes', mes: 9990, anual: 99900 },
  { label: 'sun', desc: 'Varias páginas · 15 preguntas', price: '$19.990 al mes', mes: 19990, anual: 199900 },
  { label: 'vibe', desc: 'Sitio + panel · 19 preguntas', price: '$39.990 al mes', mes: 39990, anual: 399900 }
];
const WHERE = ['A domicilio', 'En mi taller o local', 'En línea'];
const FIELDS = ['Fecha', 'Dirección', 'Cantidad', 'Fotos', 'Presupuesto', 'Horario'];
const AVGS = ['Hasta $50.000', '$50.000 – $150.000', '$150.000 – $400.000', 'Más de $400.000'];
const REPLIES = ['En 2 horas', 'El mismo día', 'En 24 horas'];
const BOOKS = ['Cuaderno', 'Excel', 'No llevo', 'Otro'];
const SVC_PH = ['Ej: Animación de matrimonio', 'Ej: Ceremonia simbólica', 'Ej: Canto en misa', 'Otro servicio', 'Otro servicio', 'Otro servicio'];
const OFICIOS = [
  { label: 'Animación y ceremonias', head: 'La voz del momento.', style: 1, bg: 0, motion: 2, palette: 0,
    concepts: ['Puño en alto bajo los focos, vista desde abajo', 'Micrófono en primer plano, público desenfocado detrás', 'Confeti congelado en el aire sobre la pista'] },
  { label: 'Jardinería', head: 'Le doy forma a lo que crece.', style: 0, bg: 1, motion: 1, palette: 2,
    concepts: ['Dos arbustos podados como leones sentados en sus patas traseras', 'Manos con tierra sosteniendo un brote, primer plano', 'Túnel de enredaderas visto en perspectiva'] },
  { label: 'Carpintería', head: 'Hecho a mano.', style: 0, bg: 0, motion: 1, palette: 1,
    concepts: ['Viruta en espiral saliendo del cepillo, macro', 'Una silla en contraluz sobre el banco de trabajo', 'Veta de madera y manos en primer plano'] },
  { label: 'Peluquería y barbería', head: 'Tu mejor versión, a tijera.', style: 0, bg: 0, motion: 1, palette: 5,
    concepts: ['Tijera abierta cortando un mechón en el aire', 'Perfil con degradado perfecto y luz lateral', 'Silla de barbero vacía bajo un solo foco'] },
  { label: 'Cocina', head: 'Sabor con memoria.', style: 0, bg: 0, motion: 2, palette: 1,
    concepts: ['Llamarada en el sartén, vista cenital', 'Harina cayendo sobre manos que amasan', 'Plato terminado a contraluz, con vapor'] },
  { label: 'Tatuaje', head: 'Arte que se queda.', style: 1, bg: 0, motion: 2, palette: 4,
    concepts: ['Aguja en macro con una gota de tinta suspendida', 'Brazo completo tatuado en blanco y negro', 'Un boceto que se convierte en piel'] },
  { label: 'Costura y diseño', head: 'A tu medida.', style: 0, bg: 1, motion: 1, palette: 0,
    concepts: ['Hilo rojo atravesando la aguja, macro', 'Vestido en maniquí con alfileres, vista desde abajo', 'Telas cayendo en cascada'] },
  { label: 'Panadería / pastelería', head: 'Pan caliente, bien hecho.', style: 0, bg: 1, motion: 1, palette: 1, img: 4,
    concepts: ['Harina cayendo sobre manos que amasan', 'Pan recién salido del horno, con vapor', 'Torta de pisos con una espátula terminando el borde'] },
  { label: 'Fotografía', head: 'Miro lo que otros no ven.', style: 0, bg: 0, motion: 1, palette: 5,
    concepts: ['Un lente en primer plano reflejando la escena', 'La ciudad encuadrada entre dos manos', 'Cámara antigua sobre un mapa de rollos revelados'] },
  { label: 'Música en vivo', head: 'Suena distinto en vivo.', style: 1, bg: 0, motion: 2, palette: 4,
    concepts: ['Guitarra vista desde abajo con luces de escenario', 'Manos sobre el teclado con humo detrás', 'Público con las manos arriba, en contraluz'] },
  { label: 'Belleza y maquillaje', head: 'Lo que ya eres, más visible.', style: 0, bg: 1, motion: 1, palette: 0,
    concepts: ['Pincel con polvo suspendido en el aire', 'Mirada en primer plano con delineado perfecto', 'Mesa de trabajo ordenada desde arriba'] },
  { label: 'Masoterapia', head: 'Tus manos descansan en las mías.', style: 0, bg: 1, motion: 0, palette: 2,
    concepts: ['Piedras calientes apiladas con vapor', 'Manos sobre una espalda, luz cálida lateral', 'Una toalla doblada y una rama de eucalipto'] },
  { label: 'Cerámica', head: 'Del barro a tu mesa.', style: 0, bg: 1, motion: 1, palette: 1,
    concepts: ['Manos con barro sobre el torno, en movimiento', 'Tazones recién esmaltados en fila', 'Horno abierto con brasas detrás de una pieza'] },
  { label: 'Herrería y soldadura', head: 'Fuego que queda firme.', style: 0, bg: 0, motion: 2, palette: 1,
    concepts: ['Chispas de soldadura vistas desde abajo', 'Martillo sobre hierro al rojo, macro', 'Una reja terminada recortada contra el cielo'] },
  { label: 'Mecánica', head: 'Lo dejo andando.', style: 0, bg: 0, motion: 1, palette: 3,
    concepts: ['Manos con grasa sujetando una llave, primer plano', 'Motor abierto visto desde arriba', 'Un auto clásico bajo una lámpara de taller'] },
  { label: 'Electricidad', head: 'Donde yo paso, se prende.', style: 1, bg: 0, motion: 2, palette: 3,
    concepts: ['Una ampolleta encendiéndose en la oscuridad', 'Cables ordenados como un tejido', 'Tablero eléctrico abierto con luz azul'] },
  { label: 'Gasfitería', head: 'Agua donde tiene que ir.', style: 1, bg: 1, motion: 1, palette: 3,
    concepts: ['Una gota cayendo desde una llave, macro', 'Tuberías de cobre como laberinto', 'Llave inglesa sobre fondo de azulejos'] },
  { label: 'Maestro chasquilla', head: 'Lo arreglo todo.', style: 1, bg: 1, motion: 1, palette: 1,
    concepts: ['Caja de herramientas abierta vista desde arriba', 'Una casa en corte con cada arreglo marcado', 'Manos sosteniendo un taladro, perspectiva baja'] },
  { label: 'Pintura de casas', head: 'Le cambio la cara a tu casa.', style: 1, bg: 1, motion: 1, palette: 0,
    concepts: ['Rodillo dejando una franja de color en un muro blanco', 'Fachada mitad gris, mitad recién pintada', 'Brochas y tarros de colores en fila'] },
  { label: 'Clases particulares', head: 'Aprender se nota.', style: 1, bg: 1, motion: 1, palette: 3,
    concepts: ['Una pizarra llena con un “¡ahora sí!” marcado', 'Cuaderno abierto con un lápiz a medio subrayar', 'Dos manos sobre el mismo libro'] },
  { label: 'Cuidado de mascotas', head: 'Tu regalón en buenas manos.', style: 1, bg: 1, motion: 2, palette: 2,
    concepts: ['Perro saltando hacia la cámara, vista baja', 'Gato recién peinado mirando de frente', 'Correas de colores colgadas en fila'] },
  { label: 'Otro oficio', head: 'Hecho por mí.', style: 0, bg: 0, motion: 1, palette: 1, img: null,
    concepts: ['Tus manos en plena acción, primer plano', 'Tu herramienta principal tratada como escultura', 'Tu obra terminada, vista desde abajo'] }
];
const MOTIFS = ["M44 30a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M45 40L37 8L43 6L51 38z M36 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M43 39L61 39L63 72L45 72z M45 71L53 71L37 118L29 118z M54 71L63 71L79 118L71 118z M60 41L65 43L71 73L67 74z M68.4 74L69.6 74L73.6 118L72.4 118z", "M2 9a10 10 0 1 0 20 0 M12 19a10 10 0 0 1 10 -10 M2 9a10 10 0 0 1 10 10 M12 4a9.7 9.7 0 0 1 2.99 7.5 M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5", "M11.414 10l-7.383 7.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l7.407 -7.385 M18.121 15.293l2.586 -2.586a1 1 0 0 0 0 -1.414l-7.586 -7.586a1 1 0 0 0 -1.414 0l-2.586 2.586a1 1 0 0 0 0 1.414l7.586 7.586a1 1 0 0 0 1.414 0z", "M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M8.6 8.6l10.4 10.4 M8.6 15.4l10.4 -10.4", "M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092 -7.723a4 4 0 0 1 3.908 -3.151z M6.161 17.009l11.839 -.009", "M3 21c-.667 -.667 3.262 -6.236 11.785 -16.709a3.5 3.5 0 1 1 5.078 4.791c-10.575 8.612 -16.196 12.585 -16.863 11.918z M17.5 6.5l-1 1", "M3 21c-.667 -.667 3.262 -6.236 11.785 -16.709a3.5 3.5 0 1 1 5.078 4.791c-10.575 8.612 -16.196 12.585 -16.863 11.918z M17.5 6.5l-1 1 M17 7c-2.333 -2.667 -3.5 -4 -5 -4s-2 1 -2 2c0 4 8.161 8.406 6 11c-1.056 1.268 -3.363 1.285 -5.75 .808 M5.739 15.425c-1.393 -.565 -3.739 -1.925 -3.739 -3.425 M19.5 9.5l1.5 1.5", "M3 20h18v-8a3 3 0 0 0 -3 -3h-12a3 3 0 0 0 -3 3v8z M3 14.803c.312 .135 .654 .204 1 .197a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1c.35 .007 .692 -.062 1 -.197 M12 4l1.465 1.638a2 2 0 1 1 -3.015 .099l1.55 -1.737z", "M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2 M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0", "M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0 M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0 M9 17v-13h10v13 M9 8h10", "M3 21v-4a4 4 0 1 1 4 4h-4 M21 3a16 16 0 0 0 -12.8 10.2 M21 3a16 16 0 0 1 -10.2 12.8 M10.6 9a9 9 0 0 1 4.4 4.4", "M4 17m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M4 22l4 -2v-3h12 M11 20h9 M8 14l3 -2l1 -4c3 1 3 4 3 6", "M4 8h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z", "M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235", "M3 10v6 M12 5v3 M10 5h4 M5 13h-2 M6 10h2l2 -2h3.382a1 1 0 0 1 .894 .553l1.448 2.894a1 1 0 0 0 .894 .553h1.382v-2h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2v-2h-3v2a1 1 0 0 1 -1 1h-3.465a1 1 0 0 1 -.832 -.445l-1.703 -2.555h-2v-6z", "M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7 M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3 M9.7 17l4.6 0", "M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546z", "M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4 M14.5 5.5l4 4 M12 8l-5 -5l-4 4l5 5 M7 8l-1.5 1.5 M16 12l5 5l-4 4l-5 -5 M16 17l-1.5 1.5", "M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z M19 6h1a2 2 0 0 1 2 2a5 5 0 0 1 -5 5l-5 0v2 M10 15m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z", "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0 M3 6l0 13 M12 6l0 13 M21 6l0 13", "M14.7 13.5c-1.1 -2 -1.441 -2.5 -2.7 -2.5c-1.259 0 -1.736 .755 -2.836 2.747c-.942 1.703 -2.846 1.845 -3.321 3.291c-.097 .265 -.145 .677 -.143 .962c0 1.176 .787 2 1.8 2c1.259 0 3 -1 4.5 -1s3.241 1 4.5 1c1.013 0 1.8 -.823 1.8 -2c0 -.285 -.049 -.697 -.146 -.962c-.475 -1.451 -2.512 -1.835 -3.454 -3.538z M20.188 8.082a1.039 1.039 0 0 0 -.406 -.082h-.015c-.735 .012 -1.56 .75 -1.993 1.866c-.519 1.335 -.28 2.7 .538 3.052c.129 .055 .267 .082 .406 .082c.739 0 1.575 -.742 2.011 -1.866c.516 -1.335 .273 -2.7 -.54 -3.052z M9.474 9c.055 0 .109 0 .163 -.011c.944 -.128 1.533 -1.346 1.32 -2.722c-.203 -1.297 -1.047 -2.267 -1.932 -2.267c-.055 0 -.109 0 -.163 .011c-.944 .128 -1.533 1.346 -1.32 2.722c.204 1.293 1.048 2.267 1.933 2.267z M16.456 6.733c.214 -1.376 -.375 -2.594 -1.32 -2.722a1.164 1.164 0 0 0 -.162 -.011c-.885 0 -1.728 .97 -1.93 2.267c-.214 1.376 .375 2.594 1.32 2.722c.054 .007 .108 .011 .162 .011c.885 0 1.73 -.974 1.93 -2.267z M5.69 12.918c.816 -.352 1.054 -1.719 .536 -3.052c-.436 -1.124 -1.271 -1.866 -2.009 -1.866c-.14 0 -.277 .027 -.407 .082c-.816 .352 -1.054 1.719 -.536 3.052c.436 1.124 1.271 1.866 2.009 1.866c.14 0 .277 -.027 .407 -.082z", "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"];
const ENFOQUES = [
  { label: 'Ilustración', style: 1, palette: null, bg: null },
  { label: 'Primer plano', style: 0, palette: 5, bg: 0 },
  { label: 'Clásico', style: 0, palette: null, bg: 0 },
  { label: 'Mono', style: 0, palette: 5, bg: 0 }
];
const LIKES = ['Naturaleza', 'Música', 'Cine', 'Arte urbano', 'Deporte', 'Viajes', 'Tecnología', 'Lo antiguo', 'Fútbol', 'Mar', 'Montaña', 'Cocinar', 'Familia', 'Mascotas', 'Baile', 'Lectura', 'Fotografía', 'Autos y motos', 'Jardín', 'Fe', 'Humor', 'Otro'];
const PALETTES = [
  { label: 'Escenario — rojo y marfil', c: ['#E5533D', '#1F3A4D', '#3A1512'] },
  { label: 'Tierra — terracota y arena', c: ['#C8693A', '#E9D8B4', '#4A2A18'] },
  { label: 'Bosque — verdes y musgo', c: ['#4F8A5B', '#C9D9A8', '#1F3324'] },
  { label: 'Océano — azules profundos', c: ['#2F6FA8', '#9CC7E0', '#10263A'] },
  { label: 'Neón — fucsia y cian', c: ['#E0409A', '#3FD0D0', '#1A0F2A'] },
  { label: 'Monocromo — blanco y negro', c: ['#F5F0E4', '#86918E', '#080A09'] },
  { label: 'Rosa — rosado y durazno', c: ['#E8789A', '#F9D9DF', '#4A1F2C'] },
  { label: 'Violeta — lavanda y uva', c: ['#8B6CC9', '#E3D9F5', '#2A1D45'] },
  { label: 'Sol — amarillos y miel', c: ['#E9B824', '#FFF1B8', '#4A3A0C'] },
  { label: 'Pastel — celeste, menta y rosa', c: ['#7FC8E8', '#CDEFD9', '#F6C9D6'] },
  { label: 'Atardecer — rosado, violeta y naranjo', c: ['#F28C6B', '#F7C6D9', '#5B3A7A'] },
  { label: 'Mis 3 colores', c: null }
];
const CUSTOM_PAL = PALETTES.length - 1;
const STYLES = [
  { label: 'Realista', desc: 'Fotografía. Textura, luz real, el oficio tal cual.' },
  { label: 'Ilustración', desc: 'Dibujo o vector. Más gráfico, más icónico.' },
  { label: 'Collage', desc: 'Foto recortada con trazos y formas encima.' }
];
const BGS = ['Oscuro', 'Claro'];
const MOTIONS = [
  { label: 'Quieto', desc: 'Sin animaciones. Todo el peso en la imagen.' },
  { label: 'Sutil', desc: 'Entradas suaves y un zoom lento en la portada.' },
  { label: 'Con todo', desc: 'Portada viva, textos que entran con ritmo.' }
];
const TONES = [
  { label: 'Cercano', desc: 'Cuéntame qué celebramos y lo armamos juntos.' },
  { label: 'Elegante', desc: 'Cada detalle, pensado para un día que no se repite.' },
  { label: 'Divertido', desc: 'Tú pones la fiesta, yo pongo que nadie se siente.' },
  { label: 'Sobrio', desc: 'Servicio puntual, resultado garantizado.' }
];
W.SOUL_DATA = { PLANS, WHERE, FIELDS, AVGS, REPLIES, BOOKS, SVC_PH, OFICIOS, MOTIFS, ENFOQUES, LIKES, PALETTES, STYLES, BGS, MOTIONS, TONES };
})(window);
