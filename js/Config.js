var Config = {};

//base:
Config.debug = false;
Config.framerate = 60;
Config.backgroundColor = '#000';

//piece:
Config.colors = ["#FF00FF", "#0000FF", "#00FFFF", "#FF0000"];
Config.speed = [1,2];//min max
Config.angularSpeedInitial = [0,.008];//min max, radians per frame
Config.angularSpeedMax = .01;//radians per frame
Config.n = 1;

Config.scale = 1.25;//scale multiplier

//At which aspect rario (w/h) which scalefactor to use:
Config.scaleByRatio = [.6, 1.2, 1, 1, 2.5, 1.35];

//Waiting time before an object can escape, after last entering object is completely inside (or at start):
Config.escapeInterval = [10000,40000];//min max, in msecs. 

//Waiting time before new object enters, after escaping object is completely escaped:
Config.entryInterval = [2000,3000];//min max, in msecs. 

//Waiting time for new attempt at entry, when previous entry is bounced out before being in:
Config.secondaryEntryInterval = [10,10];//min max, in msecs. 

//To disable specific objects, comment out corresponding lines in assets.js

var WIDTH_P = 0.6, 
    HEIGHT_P = 0.6, 
    APPLY_FORCE = 0.4,
    DEBUG = false,
    FIGURE = 'rectangle', // 'rectangle' or 'ellipse'
    CANVAS_WIDTH = "100%", // podes poner "600" y seria pixels o "50%" y seria 50% de la pantalla
    STOPPED_MAX_INTERVAL = 300, 
    STOPPED_MARGIN_OFFSET = 4;
    
// STOPPED_MAX_INTERVAL y STOPPED_MARGIN_OFFSET para el 'ellipse' hay que ponerlos un poco mas alto