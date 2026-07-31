// =============================================
// AGE OF HISTORY - MULTIPLAYER
// FULL GAME ENGINE - Chính trị + Ngoại giao + Chiến tranh
// =============================================

import { initializeApp } from "firebase/app";
import { 
    getDatabase, ref, set, get, update, onValue, push, child, remove
} from "firebase/database";
import { 
    getAuth, signInAnonymously, onAuthStateChanged, signOut
} from "firebase/auth";

// ============== FIREBASE CONFIG ==============
const firebaseConfig = {
    apiKey: "AIzaSyCGXq3xpUv_qaH5R7RB9LlJwsnVhrlewoA",
    authDomain: "country-61ecf.firebaseapp.com",
    databaseURL: "https://country-61ecf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "country-61ecf",
    storageBucket: "country-61ecf.firebasestorage.app",
    messagingSenderId: "91679803947",
    appId: "1:91679803947:web:4700703e957e9c1b1cb86e",
    measurementId: "G-XQFVPJLF7R"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// ============== MAP DATA ==============
const MAP_DATA = {
    groups: {
        "#8dd3c7": { country: "uk", name: "🇬🇧 Vương quốc Anh", color: "#8dd3c7" },
        "#999999": { country: "de", name: "🇩🇪 Đức", color: "#999999" },
        "#225ea8": { country: "fr", name: "🇫🇷 Pháp", color: "#225ea8" },
        "#fb8072": { country: "ua", name: "🇺🇦 Ukraina", color: "#fb8072" },
        "diagonal3_3264c8_ffffff": { country: "es", name: "🇪🇸 Tây Ban Nha", color: "#3264c8" },
        "#fc4e2a": { country: "it", name: "🇮🇹 Ý", color: "#fc4e2a" },
        "#4daf4a": { country: "tr", name: "🇹🇷 Thổ Nhĩ Kỳ", color: "#4daf4a" },
        "#fdd49e": { country: "at", name: "🇦🇹 Áo", color: "#fdd49e" },
        "circles3_a03500_000000": { country: "be", name: "🇧🇪 Bỉ", color: "#a03500" },
        "#cc3333": { country: "ee", name: "🇪🇪 Estonia", color: "#cc3333" },
        "#a6cee3": { country: "gr", name: "🇬🇷 Hy Lạp", color: "#a6cee3" },
        "#decbe4": { country: "ch", name: "🇨🇭 Thụy Sĩ", color: "#decbe4" },
        "#d73027": { country: "ru", name: "🇷🇺 Nga", color: "#d73027" }
    },
    provinces: {
        uk: ["Derry_City_and_Strabane_UK","Fermanagh_and_Omagh_UK","Mid_Ulster_UK","Armagh_City_Banbridge_and_Craigavon_UK","Newry_City_Mourne_and_Down_UK","Gibraltar_UK","Flintshire_UK","Cheshire_East_UK","Cheshire_West_and_Chester_UK","Halton_UK","Wrexham_UK","Shropshire_UK","Powys_UK","Herefordshire_UK","Monmouthshire_UK","Gloucestershire_UK","Scottish_Borders_UK","Northumberland_UK","Westmorland_and_Furness_UK","Cumberland_UK","Dumfries_and_Galloway_UK","Causeway_Coast_and_Glens_UK","Mid_and_East_Antrim_UK","Antrim_and_Newtownabbey_UK","Belfast_UK","North_Down_and_Ards_UK","Clackmannanshire_UK","Stirling_UK","Falkirk_UK","West_Lothian_UK","Edinburgh_UK","Midlothian_UK","East_Lothian_UK","Tyne_and_Wear_UK","County_Durham_UK","Hartlepool_UK","Redcar_and_Cleveland_UK","North_Yorkshire_UK","East_Riding_of_Yorkshire_UK","Kingston_upon_Hull_UK","North_Lincolnshire_UK","North_East_Lincolnshire_UK","Lincolnshire_UK","Norfolk_UK","Suffolk_UK","Essex_UK","Southend-on-Sea_UK","Thurrock_UK","Kent_UK","Medway_UK","East_Sussex_UK","Brighton_and_Hove_UK","West_Sussex_UK","Hampshire_UK","Portsmouth_UK","Southampton_UK","Bournemouth_Christchurch_and_Poole_UK","Dorset_UK","Devon_UK","Torbay_UK","Plymouth_UK","Cornwall_UK","Somerset_UK","North_Somerset_UK","Bristol_UK","South_Gloucestershire_UK","Newport_UK","Cardiff_UK","Vale_of_Glamorgan_UK","Bridgend_UK","Neath_Port_Talbot_UK","Swansea_UK","Carmarthenshire_UK","Pembrokeshire_UK","Ceredigion_UK","Gwynedd_UK","Conwy_UK","Denbighshire_UK","Wirral_UK","Merseyside_UK","Lancashire_UK","Blackpool_UK","South_Ayrshire_UK","Inverclyde_UK","Renfrewshire_UK","West_Dunbartonshire_UK","North_Ayshire_UK","Argyll_and_Bute_UK","Highland_UK","Moray_UK","Aberdeenshire_UK","Aberdeen_UK","Angus_UK","Dundee_UK","Perth_and_Kinross_UK","Fife_UK","Isle_of_Wight_UK","Anglesey_UK","Na_hʼEileanan_Siar_UK","Orkney_Islands_UK","Shetland_Islands_UK","Caerphilly_UK","Rhondda_Cynon_Taff_UK","Blaenau_Gwent_UK","Torfaen_UK","Merthyr_Tydfil_UK","North_Lanarkshire_UK","East_Dunbartonshire_UK","Glasgow_UK","East_Renfrewshire_UK","East_Ayrshire_UK","South_Lanarkshire_UK","Lisburn_City_and_Castlereagh_UK","Wandsworth_UK","Merton_UK","Westminster_UK","Kensington_and_Chelsea_UK","Hounslow_UK","Ealing_UK","Hammersmith_and_Fulham_UK","Stockton-on-Tees_UK","Darlington_UK","Middlesbrough_UK","Richmond_upon_Thames_UK","City_of_London_UK","Tower_Hamlets_UK","York_UK","Enfield_UK","Hertfordshire_UK","Barnet_UK","Waltham_Forest_UK","Redbridge_UK","Havering_UK","Cambridgeshire_UK","Bexley_UK","Sutton_UK","Milton_Keynes_UK","Buckinghamshire_UK","Hillingdon_UK","Brent_UK","Luton_UK","Central_Bedfordshire_UK","Bedford_UK","Harrow_UK","Rutland_UK","Nottinghamshire_UK","West_Northamptonshire_UK","North_Northamptonshire_UK","Camden_UK","Islington_UK","Peterborough_UK","Lambeth_UK","Southwark_UK","South_Yorkshire_UK","Croydon_UK","Lewisham_UK","Haringey_UK","Kingston_upon_Thames_UK","Newham_UK","Greenwich_UK","Hackney_UK","Barking_and_Dagenham_UK","Leicestershire_UK","Derbyshire_UK","Stoke-on-Trent_UK","Telford_and_Wrekin_UK","Staffordshire_UK","Bromley_UK","Worcestershire_UK","Warwickshire_UK","Oxfordshire_UK","Manchester_UK","Warrington_UK","Reading_UK","West_Berkshire_UK","Wokingham_UK","Bracknell_Forest_UK","Slough_UK","Windsor_and_Maidenhead_UK","Surrey_UK","Blackburn_with_Darwen_UK","Swindon_UK","Bath_and_North_East_Somerset_UK","Wiltshire_UK","West_Yorkshire_UK","Nottingham_UK","Leicester_UK","Derby_UK","West_Midlands_UK"],
        de: ["Sachsen_DE","Bayern_DE","Rheinland-Pfalz_DE","Saarland_DE","Schleswig-Holstein_DE","Niedersachsen_DE","Nordrhein-Westfalen_DE","Baden-Württemberg_DE","Brandenburg_DE","Mecklenburg-Vorpommern_DE","Bremen_DE","Hamburg_DE","Hessen_DE","Thüringen_DE","Sachsen-Anhalt_DE","Berlin_DE"],
        fr: ["Hauts-de-France_FR","Grand_Est_FR","Provence-Alpes-Côte-d_Azur_FR","Auvergne-Rhône-Alpes_FR","Nouvelle-Aquitaine_FR","Occitanie_FR","Bourgogne-Franche-Comté_FR","Pays_de_la_Loire_FR","Bretagne_FR","Normandy_FR","Corsica_FR","Centre-Val_de_Loire_FR","Île-de-France_FR"],
        ua: ["Chernihiv_UA","Volyn_UA","Rivne_UA","Zhytomyr_UA","Kyiv_UA","Transcarpathia_UA","Chernivtsi_UA","Ivano-Frankivsk_UA","Odessa_UA","Vinnytsya_UA","L’viv_UA","Sumy_UA","Kharkiv_UA","Luhansk_UA","Donetsk_UA","Crimea_UA","Kherson_UA","Zaporizhzhya_UA","Sevastopol_UA","Mykolayiv_UA","Poltava_UA","Khmelnytskyi_UA","Ternopil__UA","Dnipropetrovsk_UA","Cherkasy_UA","Kirovohrad_UA","Kyiv_city_UA"],
        es: ["Ceuta_ES","Melilla_ES","Comunidad_Foral_de_Navarra_ES","País_Vasco_ES","Aragón_ES","Cataluña_ES","Extremadura_ES","Andalucía_ES","Galicia_ES","Castilla_y_León_ES","Comunidad_Valenciana_ES","Región_de_Murcia_ES","Principado_de_Asturias_ES","Cantabria_ES","Islas_Baleares_ES","La_Rioja_ES","Castilla-La_Mancha_ES","Comunidad_de_Madrid_ES"],
        it: ["Valle_d_Aosta_IT","Piemonte_IT","Lombardia_IT","Trentino-Alto_Adige_IT","Liguria_IT","Emilia-Romagna_IT","Marche_IT","Veneto_IT","Friuli-Venezia_Giulia_IT","Abruzzo_IT","Molise_IT","Apulia_IT","Basilicata_IT","Calabria_IT","Campania_IT","Lazio_IT","Toscana_IT","Sicily_IT","Sardegna_IT","Umbria_IT"],
        tr: ["Kirklareli_TR","Edirne_TR","Istanbul_TR","Tekirdag_TR","Çanakkale_TR"],
        at: ["Niederösterreich_AT","Oberösterreich_AT","Burgenland_AT","Vorarlberg_AT","Tirol_AT","Salzburg_AT","Kärnten_AT","Steiermark_AT","Wien_AT"],
        be: ["West_Flanders_BE","Hainaut_BE","Namur_BE","Luxembourg_BE","Liege_BE","East_Flanders_BE","Antwerp_BE","Limburg_BE","Brussels_BE","Flemish_Brabant_BE","Walloon_Brabant_BE"],
        ee: ["Viljandi_EE","Pärnu_EE","Valga_EE","Võru_EE","Ida-Viru_EE","Põlva_EE","Tartu_EE","Jõgeva_EE","Lääne_EE","Harju_EE","Lääne-Viru_EE","Saare_EE","Hiiu_EE","Rapla_EE","Järva_EE"],
        gr: ["Western_Macedonia_GR","Ipeiros_GR","Central_Macedonia_GR","Eastern_Macedonia_and_Thrace_GR","Agion_Oros_GR","Thessalia_GR","Stereá_Elláda_GR","Attiki_GR","Peloponnisos_GR","Western_Greece_GR","Crete_GR","South_Aegean_GR","North_Aegean_GR","Ionioi_Nisoi_GR"],
        ch: ["Valais_CH","Ticino_CH","Graubünden_CH","Schaffhausen_CH","Thurgau_CH","Zürich_CH","Aargau_CH","Basel-Stadt_CH","Basel-Landschaft_CH","Sankt_Gallen_CH","Solothurn_CH","Jura_CH","Genève_CH","Vaud_CH","Neuchâtel_CH","Bern_CH","Lucerne_CH","Zug_CH","Uri_CH","Schwyz_CH","Glarus_CH","Nidwalden_CH","Fribourg_CH","Obwalden_CH","Appenzell_Ausserrhoden_CH","Appenzell_Innerrhoden_CH"],
        ru: ["Pskov_RU","Krasnodar_RU","Karachay-Cherkess_RU","Kabardin-Balkar_RU","North_Ossetia_RU","Ingush_RU","Chechnya_RU","Dagestan_RU","Murmansk_RU","Karelia_RU","Leningrad_RU","Kaliningrad_RU","Smolensk_RU","Bryansk_RU","Kursk_RU","Belgorod_RU","Voronezh_RU","Rostov_RU","Orenburg_RU","Saratov_RU","Astrakhan_RU","Volgograd_RU","Nenets_RU","City_of_St__Petersburg_RU","Arkhangel’sk_RU","Kalmyk_RU","Lipetsk_RU","Tambov_RU","Tatarstan_RU","Ul_yanovsk_RU","Penza_RU","Orel_RU","Mordovia_RU","Kaluga_RU","Kostroma_RU","Yaroslavl__RU","Vladimir_RU","Ryazan_RU","Ivanovo_RU","Nizhegorod_RU","Tula_RU","Chuvash_RU","Vologda_RU","Novgorod_RU","Tver__RU","Moskovsskaya_RU","Moskva_RU","Mariy-El_RU","Kirov_RU","Udmurt_RU","Komi_RU","Samara_RU","Stavropol__RU","Adygey_RU"]
    }
};

// ============== THÔNG TIN QUỐC GIA ==============
const COUNTRIES = {
    uk: { name: '🇬🇧 Vương quốc Anh', color: '#8dd3c7', regions: 184 },
    ru: { name: '🇷🇺 Nga', color: '#d73027', regions: 54 },
    ua: { name: '🇺🇦 Ukraina', color: '#fb8072', regions: 27 },
    ch: { name: '🇨🇭 Thụy Sĩ', color: '#decbe4', regions: 26 },
    it: { name: '🇮🇹 Ý', color: '#fc4e2a', regions: 20 },
    es: { name: '🇪🇸 Tây Ban Nha', color: '#3264c8', regions: 18 },
    de: { name: '🇩🇪 Đức', color: '#999999', regions: 16 },
    fr: { name: '🇫🇷 Pháp', color: '#225ea8', regions: 13 },
    ee: { name: '🇪🇪 Estonia', color: '#cc3333', regions: 15 },
    gr: { name: '🇬🇷 Hy Lạp', color: '#a6cee3', regions: 14 },
    at: { name: '🇦🇹 Áo', color: '#fdd49e', regions: 9 },
    be: { name: '🇧🇪 Bỉ', color: '#a03500', regions: 11 },
    tr: { name: '🇹🇷 Thổ Nhĩ Kỳ', color: '#4daf4a', regions: 5 }
};

// ============== UNITS & TECH TREE ==============
const UNITS_DATA = {
    unitTypes: {
        infantry: {
            name: "🚶 Bộ binh",
            categories: {
                light_infantry: { name: "Bộ binh nhẹ", baseStats: { attack: 8, defense: 6, hp: 100 }, cost: { gold: 50, manpower: 100 }, techRequired: null },
                mechanized_infantry: { name: "Bộ binh cơ giới", baseStats: { attack: 12, defense: 10, hp: 150 }, cost: { gold: 120, manpower: 100, oil: 20 }, techRequired: "motorization" },
                marines: { name: "Thủy quân lục chiến", baseStats: { attack: 14, defense: 8, hp: 120 }, cost: { gold: 150, manpower: 120 }, techRequired: "amphibious_warfare" }
            }
        },
        armor: {
            name: "🪖 Thiết giáp",
            categories: {
                light_tank: { name: "Xe tăng hạng nhẹ", baseStats: { attack: 15, defense: 12, hp: 200 }, cost: { gold: 200, manpower: 80, oil: 40 }, techRequired: "light_armor" },
                main_battle_tank: { name: "Xe tăng chiến đấu chủ lực", baseStats: { attack: 25, defense: 22, hp: 350 }, cost: { gold: 400, manpower: 60, oil: 80 }, techRequired: "modern_armor" },
                ifv: { name: "Xe chiến đấu bộ binh", baseStats: { attack: 18, defense: 16, hp: 250 }, cost: { gold: 300, manpower: 80, oil: 50 }, techRequired: "ifv_technology" }
            }
        },
        artillery: {
            name: "💥 Pháo binh",
            categories: {
                howitzer: { name: "Pháo lựu", baseStats: { attack: 20, defense: 5, hp: 120 }, cost: { gold: 250, manpower: 120, ammo: 30 }, techRequired: "artillery" },
                self_propelled_gun: { name: "Pháo tự hành", baseStats: { attack: 28, defense: 8, hp: 150 }, cost: { gold: 350, manpower: 100, ammo: 40, oil: 30 }, techRequired: "self_propelled_artillery" },
                mlrs: { name: "Hệ thống pháo rocket", baseStats: { attack: 40, defense: 5, hp: 130 }, cost: { gold: 500, manpower: 80, ammo: 60, oil: 40 }, techRequired: "mlrs_technology" }
            }
        },
        air: {
            name: "✈️ Không quân",
            categories: {
                fighter: { name: "Máy bay tiêm kích", baseStats: { attack: 30, defense: 25, hp: 150 }, cost: { gold: 400, manpower: 20, oil: 60 }, techRequired: "jet_fighters" },
                stealth_fighter: { name: "Tiêm kích tàng hình", baseStats: { attack: 45, defense: 40, hp: 180 }, cost: { gold: 800, manpower: 15, oil: 100 }, techRequired: "stealth_technology" },
                bomber: { name: "Máy bay ném bom", baseStats: { attack: 50, defense: 10, hp: 200 }, cost: { gold: 600, manpower: 25, oil: 80 }, techRequired: "strategic_bombing" }
            }
        },
        naval: {
            name: "🚢 Hải quân",
            categories: {
                destroyer: { name: "Tàu khu trục", baseStats: { attack: 20, defense: 18, hp: 300 }, cost: { gold: 300, manpower: 150, steel: 50 }, techRequired: "modern_destroyer" },
                submarine: { name: "Tàu ngầm", baseStats: { attack: 40, defense: 10, hp: 250 }, cost: { gold: 400, manpower: 100, steel: 60 }, techRequired: "submarine_technology" },
                carrier: { name: "Tàu sân bay", baseStats: { attack: 10, defense: 20, hp: 600 }, cost: { gold: 1000, manpower: 300, steel: 150 }, techRequired: "carrier_technology" }
            }
        },
        special: {
            name: "🎯 Đơn vị đặc biệt",
            categories: {
                special_forces: { name: "Lực lượng đặc biệt", baseStats: { attack: 30, defense: 25, hp: 80 }, cost: { gold: 300, manpower: 50 }, techRequired: "special_forces_training" },
                paratroopers: { name: "Lính dù", baseStats: { attack: 18, defense: 12, hp: 90 }, cost: { gold: 200, manpower: 100 }, techRequired: "paratrooper_training" }
            }
        }
    }
};

const TECH_TREE = {
    motorization: { name: "Cơ giới hóa", description: "Trang bị xe vận tải cho bộ binh", cost: 200, requires: [] },
    light_armor: { name: "Thiết giáp hạng nhẹ", description: "Phát triển xe tăng hạng nhẹ", cost: 300, requires: ["motorization"] },
    modern_armor: { name: "Thiết giáp hiện đại", description: "Phát triển xe tăng chiến đấu chủ lực", cost: 500, requires: ["light_armor"] },
    ifv_technology: { name: "Xe chiến đấu bộ binh", description: "Phát triển IFV hiện đại", cost: 400, requires: ["motorization"] },
    artillery: { name: "Pháo binh", description: "Phát triển pháo lựu tầm trung", cost: 250, requires: [] },
    self_propelled_artillery: { name: "Pháo tự hành", description: "Pháo binh cơ giới", cost: 400, requires: ["artillery", "motorization"] },
    mlrs_technology: { name: "Hệ thống pháo rocket", description: "MLRS - Hỏa lực hủy diệt", cost: 600, requires: ["self_propelled_artillery"] },
    amphibious_warfare: { name: "Tác chiến đổ bộ", description: "Đổ bộ và tấn công ven biển", cost: 500, requires: ["marines_training"] },
    marines_training: { name: "Huấn luyện thủy quân", description: "Huấn luyện thủy quân lục chiến", cost: 300, requires: [] },
    special_forces_training: { name: "Huấn luyện đặc biệt", description: "Mở khóa lực lượng đặc biệt", cost: 500, requires: ["advanced_training"] },
    advanced_training: { name: "Huấn luyện nâng cao", description: "Tăng 20% hiệu quả chiến đấu", cost: 300, requires: ["basic_training"] },
    basic_training: { name: "Huấn luyện cơ bản", description: "Tăng 10% hiệu quả chiến đấu", cost: 150, requires: [] },
    paratrooper_training: { name: "Huấn luyện lính dù", description: "Đổ bộ phía sau chiến tuyến", cost: 350, requires: ["advanced_training"] },
    jet_fighters: { name: "Máy bay phản lực", description: "Phát triển không quân hiện đại", cost: 400, requires: [] },
    stealth_technology: { name: "Công nghệ tàng hình", description: "Phát triển máy bay tàng hình", cost: 800, requires: ["jet_fighters"] },
    strategic_bombing: { name: "Ném bom chiến lược", description: "Phát triển máy bay ném bom", cost: 500, requires: ["jet_fighters"] },
    modern_destroyer: { name: "Tàu khu trục hiện đại", description: "Tàu chiến đa nhiệm", cost: 400, requires: ["basic_naval"] },
    submarine_technology: { name: "Tàu ngầm", description: "Phát triển tàu ngầm tấn công", cost: 350, requires: ["basic_naval"] },
    carrier_technology: { name: "Tàu sân bay", description: "Phát triển tàu sân bay hiện đại", cost: 600, requires: ["basic_naval"] },
    basic_naval: { name: "Hải quân cơ bản", description: "Nền tảng phát triển hải quân", cost: 200, requires: [] },
    basic_science: { name: "Khoa học cơ bản", description: "Nền tảng cho mọi nghiên cứu", cost: 200, requires: [] },
    advanced_science: { name: "Khoa học tiên tiến", description: "Đẩy mạnh nghiên cứu", cost: 400, requires: ["basic_science"] },
    physics: { name: "Vật lý hiện đại", description: "Nền tảng cho vũ khí hạt nhân", cost: 350, requires: ["basic_science"] },
    nuclear_physics: { name: "Vật lý hạt nhân", description: "Nghiên cứu năng lượng nguyên tử", cost: 600, requires: ["physics"] }
};

// ============== TẠO PROVINCE ==============
function generateProvincesFromMapData() {
    const provinces = {};
    let id = 0;
    Object.entries(MAP_DATA.provinces).forEach(([countryCode, provinceNames]) => {
        const country = COUNTRIES[countryCode];
        if (!country) return;
        const total = provinceNames.length;
        const centerX = 200 + Math.random() * 800;
        const centerY = 100 + Math.random() * 600;
        provinceNames.forEach((name, index) => {
            const angle = (index / total) * 2 * Math.PI;
            const radius = 30 + (index % 10) * 15;
            provinces[`${countryCode}_${id}`] = {
                name: name.replace(/_[A-Z]{2}$/, ''),
                country: countryCode,
                development: ['low', 'medium', 'high', 'veryHigh'][Math.floor(Math.random() * 4)],
                population: 100000 + Math.floor(Math.random() * 5000000),
                buildings: ['barracks'],
                units: { light_infantry: 20 + Math.floor(Math.random() * 100) },
                x: Math.max(10, Math.min(1190, centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 30)),
                y: Math.max(10, Math.min(790, centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 30)),
                provinceId: name
            };
            id++;
        });
    });
    return provinces;
}

// ============== DỮ LIỆU GAME ==============
const GameData = {
    playerId: null,
    playerName: null,
    gameState: {
        turn: 0,
        currentPlayer: null,
        currentCountry: null,
        selectedProvince: null,
        phase: 'lobby',
        gameId: null,
        isHost: false,
        isMyTurn: false,
        isReady: false,
        started: false
    },
    resources: { gold: 1000, manpower: 10000, oil: 500, steel: 300, aluminum: 200, ammo: 1000 },
    provinces: generateProvincesFromMapData(),
    wars: [],
    diplomacy: {
        alliances: {},    // { countryId: [alliedCountries] }
        tradeAgreements: {}, // { countryId: [tradePartners] }
        sanctions: {}     // { countryId: [sanctionedCountries] }
    },
    techLevels: {},
    players: {},
    isSyncing: false,
    isAuthenticated: false,
    selectedCountries: [],
    peaceTreaties: [] // Lưu lịch sử hòa bình
};

const CONFIG = {
    MAP_SIZE: { width: 1200, height: 800 },
    MAX_PLAYERS: 13,
    GAME_ID: null
};

// ============== HÀM ĐĂNG NHẬP ==============
async function loginWithNickname(nickname) {
    if (!nickname || nickname.trim() === '') {
        alert('Vui lòng nhập biệt danh!');
        return;
    }
    try {
        const result = await signInAnonymously(auth);
        GameData.playerId = result.user.uid;
        GameData.playerName = nickname.trim();
        await set(ref(database, `players/${GameData.playerId}`), {
            name: GameData.playerName,
            createdAt: Date.now(),
            lastActive: Date.now()
        });
        GameData.isAuthenticated = true;
        console.log(`✅ Đã đăng nhập: ${GameData.playerName}`);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('gameMenu').style.display = 'block';
        updateCountrySelectionUI();
    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error);
        alert('Không thể đăng nhập!');
    }
}

function updateCountrySelectionUI() {
    const select = document.getElementById('countrySelect');
    if (!select) return;
    while (select.options.length > 0) select.remove(0);
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Chọn quốc gia --';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    Object.entries(COUNTRIES).forEach(([code, country]) => {
        const option = document.createElement('option');
        option.value = code;
        const isSelected = GameData.selectedCountries.includes(code);
        option.textContent = isSelected ? `🔒 ${country.name} (Đã chọn)` : country.name;
        option.disabled = isSelected;
        if (isSelected) { option.style.color = '#666'; option.style.backgroundColor = '#1a1a2a'; }
        select.appendChild(option);
    });
}

// ============== TẠO / THAM GIA PHÒNG ==============
async function createGame() {
    if (!GameData.isAuthenticated) { alert('Vui lòng đăng nhập!'); return; }
    const selectedCountry = document.getElementById('countrySelect')?.value;
    if (!selectedCountry || GameData.selectedCountries.includes(selectedCountry)) {
        alert('Vui lòng chọn quốc gia chưa được chọn!');
        return;
    }
    try {
        const gameRef = push(ref(database, 'games'));
        CONFIG.GAME_ID = gameRef.key;
        GameData.gameState.gameId = CONFIG.GAME_ID;
        GameData.gameState.isHost = true;
        GameData.gameState.currentCountry = selectedCountry;
        GameData.selectedCountries.push(selectedCountry);
        const gameData = {
            host: GameData.playerId,
            status: 'lobby',
            turn: 0,
            currentPlayer: GameData.playerId,
            maxPlayers: CONFIG.MAX_PLAYERS,
            createdAt: Date.now(),
            selectedCountries: GameData.selectedCountries,
            players: { [GameData.playerId]: { name: GameData.playerName, country: selectedCountry, isReady: false, joinedAt: Date.now() } },
            resources: { ...GameData.resources },
            provinces: GameData.provinces,
            wars: [],
            diplomacy: { alliances: {}, tradeAgreements: {}, sanctions: {} },
            techLevels: {},
            peaceTreaties: []
        };
        await set(gameRef, gameData);
        console.log(`✅ Phòng đã tạo! ID: ${CONFIG.GAME_ID}`);
        updateCountrySelectionUI();
        joinGameLobby();
    } catch (error) { console.error('❌ Lỗi tạo phòng:', error); alert('Không thể tạo phòng!'); }
}

async function joinGame(gameId) {
    if (!GameData.isAuthenticated) { alert('Vui lòng đăng nhập!'); return; }
    const selectedCountry = document.getElementById('countrySelect')?.value;
    if (!selectedCountry || GameData.selectedCountries.includes(selectedCountry)) {
        alert('Vui lòng chọn quốc gia chưa được chọn!');
        return;
    }
    try {
        const gameRef = ref(database, `games/${gameId}`);
        const snapshot = await get(gameRef);
        if (!snapshot.exists()) { alert('Phòng không tồn tại!'); return; }
        const gameData = snapshot.val();
        if (gameData.status !== 'lobby') { alert('Phòng đã bắt đầu!'); return; }
        GameData.selectedCountries = gameData.selectedCountries || [];
        if (GameData.selectedCountries.includes(selectedCountry)) {
            alert('Quốc gia này đã được chọn!');
            updateCountrySelectionUI();
            return;
        }
        await set(child(gameRef, `players/${GameData.playerId}`), {
            name: GameData.playerName, country: selectedCountry, isReady: false, joinedAt: Date.now()
        });
        GameData.selectedCountries.push(selectedCountry);
        await update(gameRef, { selectedCountries: GameData.selectedCountries });
        CONFIG.GAME_ID = gameId;
        GameData.gameState.gameId = gameId;
        GameData.gameState.isHost = false;
        GameData.gameState.currentCountry = selectedCountry;
        console.log(`✅ Đã tham gia phòng!`);
        updateCountrySelectionUI();
        joinGameLobby();
    } catch (error) { console.error('❌ Lỗi tham gia phòng:', error); alert('Không thể tham gia phòng!'); }
}

// ============== LOBBY ==============
function joinGameLobby() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('lobbyContainer').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
    listenToGameChanges();
    renderLobby();
}

function renderLobby() {
    const lobby = document.getElementById('lobbyContainer');
    if (!lobby) return;
    const gameRef = ref(database, `games/${CONFIG.GAME_ID}`);
    onValue(gameRef, (snapshot) => {
        if (!snapshot.exists()) { lobby.innerHTML = `<p style="color:red;">❌ Phòng đã bị xóa!</p>`; return; }
        const data = snapshot.val();
        const players = data.players || {};
        const playerCount = Object.keys(players).length;
        const isHost = data.host === GameData.playerId;
        const allReady = Object.values(players).every(p => p.isReady) && playerCount >= 2;
        let html = `<div style="max-width:800px; margin:0 auto; padding:20px;">
            <h2>🏠 Phòng chờ</h2>
            <p><strong>Mã phòng:</strong> <code>${CONFIG.GAME_ID}</code></p>
            <p><strong>Người chơi:</strong> ${playerCount}/${CONFIG.MAX_PLAYERS}</p>
            <div style="margin:20px 0;"><h3>👥 Danh sách</h3><ul style="list-style:none; padding:0;">`;
        Object.entries(players).forEach(([id, player]) => {
            const isMe = id === GameData.playerId;
            const countryInfo = COUNTRIES[player.country];
            html += `<li style="padding:10px; margin:5px 0; background:${isMe ? '#2a4a6a' : '#1a2a3a'}; border-radius:8px; display:flex; justify-content:space-between;">
                <span>${isMe ? '👈' : ''} <strong>${player.name}</strong> ${isMe ? '(Bạn)' : ''} - ${countryInfo?.name || player.country}</span>
                <span>${player.isReady ? '✅ Sẵn sàng' : '⏳ Chưa sẵn sàng'}</span>
            </li>`;
        });
        html += `</ul></div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button onclick="toggleReady()" style="padding:10px 20px; background:${GameData.gameState.isReady ? '#2a8a2a' : '#4a6a8a'};">
                    ${GameData.gameState.isReady ? '❌ Hủy sẵn sàng' : '✅ Sẵn sàng'}
                </button>`;
        if (isHost) {
            html += `<button onclick="startGame()" style="padding:10px 20px; background:#ff8a00;" ${!allReady ? 'disabled' : ''}>
                🚀 Bắt đầu game ${!allReady ? '(Cần ít nhất 2 người sẵn sàng)' : ''}
            </button>`;
        }
        html += `<button onclick="leaveGame()" style="padding:10px 20px; background:#6a2a2a;">🚪 Rời phòng</button>
            </div></div>`;
        lobby.innerHTML = html;
    });
}

async function toggleReady() {
    if (!CONFIG.GAME_ID) return;
    GameData.gameState.isReady = !GameData.gameState.isReady;
    await set(ref(database, `games/${CONFIG.GAME_ID}/players/${GameData.playerId}/isReady`), GameData.gameState.isReady);
}

async function startGame() {
    if (!GameData.gameState.isHost) return alert('Chỉ Host mới được bắt đầu!');
    await update(ref(database, `games/${CONFIG.GAME_ID}`), { status: 'playing', startedAt: Date.now() });
}

async function leaveGame() {
    if (!confirm('Rời phòng?')) return;
    try {
        await remove(ref(database, `games/${CONFIG.GAME_ID}/players/${GameData.playerId}`));
        const gameRef = ref(database, `games/${CONFIG.GAME_ID}`);
        const snap = await get(gameRef);
        if (!snap.val()?.players || Object.keys(snap.val().players).length === 0) await remove(gameRef);
        location.reload();
    } catch (error) { console.error('Lỗi rời phòng:', error); }
}

// ============== LẮNG NGHE THAY ĐỔI ==============
function listenToGameChanges() {
    if (!CONFIG.GAME_ID) return;
    const gameRef = ref(database, `games/${CONFIG.GAME_ID}`);
    onValue(gameRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        if (GameData.isSyncing) return;
        GameData.resources = data.resources || GameData.resources;
        GameData.provinces = data.provinces || GameData.provinces;
        GameData.wars = data.wars || [];
        GameData.diplomacy = data.diplomacy || { alliances: {}, tradeAgreements: {}, sanctions: {} };
        GameData.techLevels = data.techLevels || {};
        GameData.peaceTreaties = data.peaceTreaties || [];
        GameData.gameState.turn = data.turn || 0;
        GameData.gameState.currentPlayer = data.currentPlayer || null;
        GameData.gameState.isMyTurn = data.currentPlayer === GameData.playerId;
        if (data.status === 'playing' && !GameData.gameState.started) {
            GameData.gameState.started = true;
            document.getElementById('lobbyContainer').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'flex';
            renderMap();
            updateUI();
        }
        if (data.status === 'playing') {
            updateUI();
            renderMap();
            checkWarStatus();
        }
    });
}

// ============== HỆ THỐNG CHÍNH TRỊ ==============

// -------- NGOẠI GIAO --------
function showDiplomacy() {
    const modal = document.getElementById('diplomacyModal');
    const content = document.getElementById('diplomacyContent');
    const myCountry = GameData.gameState.currentCountry;
    let html = `<h3>🌍 Ngoại giao - ${COUNTRIES[myCountry]?.name}</h3>
        <div style="max-height:500px; overflow-y:auto;">`;

    Object.entries(COUNTRIES).forEach(([code, country]) => {
        if (code === myCountry) return;
        const isAlly = GameData.diplomacy.alliances[myCountry]?.includes(code) || false;
        const isTrading = GameData.diplomacy.tradeAgreements[myCountry]?.includes(code) || false;
        const isSanctioned = GameData.diplomacy.sanctions[myCountry]?.includes(code) || false;
        const isAtWar = GameData.wars.some(w => 
            (w.attacker === myCountry && w.defender === code) || 
            (w.attacker === code && w.defender === myCountry)
        );
        const isNeutral = !isAlly && !isAtWar;

        html += `<div style="border:1px solid #444; padding:12px; margin:8px 0; border-radius:4px; ${isAtWar ? 'background:#3a1a1a;' : isAlly ? 'background:#1a3a1a;' : ''}">
            <strong>${country.name}</strong>
            <span style="margin-left:10px; font-size:12px;">
                ${isAtWar ? '⚔️ Chiến tranh' : isAlly ? '🤝 Đồng minh' : isTrading ? '📦 Thương mại' : isSanctioned ? '🚫 Trừng phạt' : '😐 Trung lập'}
            </span>
            <div style="margin-top:8px; display:flex; gap:5px; flex-wrap:wrap;">
                ${!isAtWar && !isAlly ? `<button onclick="declareWar('${code}')" style="background:#8a2a2a;">⚔️ Tuyên chiến</button>` : ''}
                ${!isAtWar && !isAlly ? `<button onclick="formAlliance('${code}')">🤝 Liên minh</button>` : ''}
                ${isAlly ? `<button onclick="breakAlliance('${code}')" style="background:#8a6a2a;">💔 Phá liên minh</button>` : ''}
                ${!isAtWar && !isTrading ? `<button onclick="tradeAgreement('${code}')">📦 Thương mại</button>` : ''}
                ${isTrading ? `<button onclick="cancelTrade('${code}')" style="background:#8a6a2a;">🚫 Hủy thương mại</button>` : ''}
                ${!isAtWar && !isSanctioned ? `<button onclick="imposeSanctions('${code}')" style="background:#6a4a2a;">🚫 Trừng phạt</button>` : ''}
                ${isAtWar ? `<button onclick="peaceNegotiation('${code}')" style="background:#2a6a2a;">☮️ Đàm phán hòa bình</button>` : ''}
            </div>
        </div>`;
    });

    html += `</div><button onclick="closeModal('diplomacyModal')">Đóng</button>`;
    content.innerHTML = html;
    modal.style.display = 'block';
}

// -------- LIÊN MINH --------
async function formAlliance(targetCountry) {
    if (!GameData.gameState.isMyTurn) return alert('Chưa đến lượt bạn!');
    const myCountry = GameData.gameState.currentCountry;
    if (!GameData.diplomacy.alliances[myCountry]) GameData.diplomacy.alliances[myCountry] = [];
    if (GameData.diplomacy.alliances[myCountry].includes(targetCountry)) {
        return alert('Đã là đồng minh!');
    }
    GameData.diplomacy.alliances[myCountry].push(targetCountry);
    if (!GameData.diplomacy.alliances[targetCountry]) GameData.diplomacy.alliances[targetCountry] = [];
    GameData.diplomacy.alliances[targetCountry].push(myCountry);
    await syncDiplomacy();
    alert(`✅ Đã liên minh với ${COUNTRIES[targetCountry]?.name}!`);
    showDiplomacy();
}

async function breakAlliance(targetCountry) {
    if (!confirm(`Phá liên minh với ${COUNTRIES[targetCountry]?.name}?`)) return;
    const myCountry = GameData.gameState.currentCountry;
    GameData.diplomacy.alliances[myCountry] = GameData.diplomacy.alliances[myCountry].filter(c => c !== targetCountry);
    GameData.diplomacy.alliances[targetCountry] = GameData.diplomacy.alliances[targetCountry].filter(c => c !== myCountry);
    await syncDiplomacy();
    alert(`💔 Đã phá liên minh!`);
    showDiplomacy();
}

// -------- THƯƠNG MẠI --------
async function tradeAgreement(targetCountry) {
    if (!GameData.gameState.isMyTurn) return alert('Chưa đến lượt bạn!');
    const myCountry = GameData.gameState.currentCountry;
    if (!GameData.diplomacy.tradeAgreements[myCountry]) GameData.diplomacy.tradeAgreements[myCountry] = [];
    if (GameData.diplomacy.tradeAgreements[myCountry].includes(targetCountry)) {
        return alert('Đã có thỏa thuận thương mại!');
    }
    GameData.diplomacy.tradeAgreements[myCountry].push(targetCountry);
    if (!GameData.diplomacy.tradeAgreements[targetCountry]) GameData.diplomacy.tradeAgreements[targetCountry] = [];
    GameData.diplomacy.tradeAgreements[targetCountry].push(myCountry);
    // Thêm vàng mỗi turn từ thương mại
    GameData.resources.gold += 50;
    await syncDiplomacy();
    await update(ref(database, `games/${CONFIG.GAME_ID}/resources`), GameData.resources);
    alert(`📦 Đã ký thỏa thuận thương mại với ${COUNTRIES[targetCountry]?.name}! (+50 vàng)`);
    showDiplomacy();
}

async function cancelTrade(targetCountry) {
    const myCountry = GameData.gameState.currentCountry;
    GameData.diplomacy.tradeAgreements[myCountry] = GameData.diplomacy.tradeAgreements[myCountry].filter(c => c !== targetCountry);
    GameData.diplomacy.tradeAgreements[targetCountry] = GameData.diplomacy.tradeAgreements[targetCountry].filter(c => c !== myCountry);
    await syncDiplomacy();
    alert(`🚫 Đã hủy thương mại!`);
    showDiplomacy();
}

// -------- TRỪNG PHẠT --------
async function imposeSanctions(targetCountry) {
    if (!GameData.gameState.isMyTurn) return alert('Chưa đến lượt bạn!');
    const myCountry = GameData.gameState.currentCountry;
    if (!GameData.diplomacy.sanctions[myCountry]) GameData.diplomacy.sanctions[myCountry] = [];
    if (GameData.diplomacy.sanctions[myCountry].includes(targetCountry)) {
        return alert('Đã áp trừng phạt!');
    }
    GameData.diplomacy.sanctions[myCountry].push(targetCountry);
    // Ảnh hưởng: giảm vàng của đối phương
    const targetResources = await get(ref(database, `games/${CONFIG.GAME_ID}/resources`));
    const res = targetResources.val();
    if (res) {
        res.gold = Math.max(0, (res.gold || 0) - 100);
        await update(ref(database, `games/${CONFIG.GAME_ID}/resources`), res);
    }
    await syncDiplomacy();
    alert(`🚫 Đã áp trừng phạt lên ${COUNTRIES[targetCountry]?.name}! (-100 vàng đối phương)`);
    showDiplomacy();
}

async function syncDiplomacy() {
    await update(ref(database, `games/${CONFIG.GAME_ID}/diplomacy`), GameData.diplomacy);
}

// -------- CHIẾN TRANH --------
async function declareWar(targetCountry) {
    if (!GameData.gameState.isMyTurn) return alert('Chưa đến lượt bạn!');
    const myCountry = GameData.gameState.currentCountry;
    
    // Kiểm tra đã có chiến tranh chưa
    if (GameData.wars.some(w => 
        (w.attacker === myCountry && w.defender === targetCountry) || 
        (w.attacker === targetCountry && w.defender === myCountry)
    )) {
        return alert('Đã có chiến tranh!');
    }

    // Kiểm tra đồng minh
    const allies = GameData.diplomacy.alliances[targetCountry] || [];
    if (allies.length > 0) {
        const allyNames = allies.map(c => COUNTRIES[c]?.name).join(', ');
        if (!confirm(`${COUNTRIES[targetCountry]?.name} có đồng minh: ${allyNames}. Vẫn tuyên chiến?`)) return;
    }

    if (!confirm(`⚔️ Tuyên chiến với ${COUNTRIES[targetCountry]?.name}?`)) return;

    const war = {
        id: Date.now().toString(),
        attacker: myCountry,
        defender: targetCountry,
        startTurn: GameData.gameState.turn,
        active: true,
        attackerCasualties: 0,
        defenderCasualties: 0,
        peaceOffers: []
    };
    GameData.wars.push(war);
    await update(ref(database, `games/${CONFIG.GAME_ID}/wars`), GameData.wars);
    alert(`⚔️ Đã tuyên chiến với ${COUNTRIES[targetCountry]?.name}!`);
    showDiplomacy();
}

// -------- CHIẾN ĐẤU TỰ ĐỘNG --------
function checkWarStatus() {
    GameData.wars.forEach(async (war, index) => {
        if (!war.active) return;
        
        const attackerProvinces = Object.entries(GameData.provinces).filter(([id, p]) => p.country === war.attacker);
        const defenderProvinces = Object.entries(GameData.provinces).filter(([id, p]) => p.country === war.defender);
        
        // Tính tổng sức mạnh
        const attackerPower = attackerProvinces.reduce((total, [id, p]) => {
            return total + Object.values(p.units || {}).reduce((sum, count) => sum + count * 10, 0);
        }, 0);
        
        const defenderPower = defenderProvinces.reduce((total, [id, p]) => {
            return total + Object.values(p.units || {}).reduce((sum, count) => sum + count * 10, 0);
        }, 0);
        
        // Chiến đấu
        if (attackerPower > defenderPower * 1.3) {
            // Attacker thắng - chiếm 1 tỉnh
            const targetProvince = defenderProvinces[Math.floor(Math.random() * defenderProvinces.length)];
            if (targetProvince) {
                const [id, province] = targetProvince;
                province.country = war.attacker;
                province.units = { light_infantry: 10 };
                war.defenderCasualties += Math.floor(defenderPower / 100);
                console.log(`💥 ${COUNTRIES[war.attacker]?.name} chiếm ${province.name}`);
            }
        } else if (defenderPower > attackerPower * 1.3) {
            // Defender thắng - phản công
            const targetProvince = attackerProvinces[Math.floor(Math.random() * attackerProvinces.length)];
            if (targetProvince) {
                const [id, province] = targetProvince;
                province.country = war.defender;
                province.units = { light_infantry: 10 };
                war.attackerCasualties += Math.floor(attackerPower / 100);
                console.log(`💥 ${COUNTRIES[war.defender]?.name} phản công chiếm ${province.name}`);
            }
        } else {
            // Hòa - hao tổn cả hai
            attackerProvinces.forEach(([id, p]) => {
                Object.keys(p.units || {}).forEach(key => {
                    p.units[key] = Math.max(0, (p.units[key] || 0) - Math.floor(Math.random() * 5));
                });
            });
            defenderProvinces.forEach(([id, p]) => {
                Object.keys(p.units || {}).forEach(key => {
                    p.units[key] = Math.max(0, (p.units[key] || 0) - Math.floor(Math.random() * 5));
                });
            });
        }
        
        // Cập nhật
        await update(ref(database, `games/${CONFIG.GAME_ID}/provinces`), GameData.provinces);
        await update(ref(database, `games/${CONFIG.GAME_ID}/wars`), GameData.wars);
    });
}

// -------- ĐÀM PHÁN HÒA BÌNH --------
function peaceNegotiation(targetCountry) {
    if (!GameData.gameState.isMyTurn) return alert('Chưa đến lượt bạn!');
    const myCountry = GameData.gameState.currentCountry;
    
    const war = GameData.wars.find(w => 
        (w.attacker === myCountry && w.defender === targetCountry) || 
        (w.attacker === targetCountry && w.defender === myCountry)
    );
    if (!war) return alert('Không có chiến tranh!');

    const modal = document.getElementById('peaceModal');
    const content = document.getElementById('peaceContent');
    
    let html = `<h3>☮️ Đàm phán hòa bình</h3>
        <p><strong>${COUNTRIES[myCountry]?.name}</strong> ⚔️ <strong>${COUNTRIES[targetCountry]?.name}</strong></p>
        <div style="margin:20px 0;">
            <h4>Điều khoản:</h4>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button onclick="proposePeace('${targetCountry}', 'whitePeace')" style="padding:10px;">
                    ☮️ Hòa bình trắng (không điều kiện)
                </button>
                <button onclick="proposePeace('${targetCountry}', 'reparations')" style="padding:10px;">
                    💰 Bồi thường chiến tranh (+200 vàng)
                </button>
                <button onclick="proposePeace('${targetCountry}', 'territory')" style="padding:10px;">
                    📍 Nhượng bộ lãnh thổ (1 tỉnh)
                </button>
                <button onclick="proposePeace('${targetCountry}', 'surrender')" style="padding:10px; background:#8a2a2a;">
                    🏳️ Yêu cầu đầu hàng (mất 2 tỉnh)
                </button>
            </div>
        </div>
        <button onclick="closeModal('peaceModal')">Đóng</button>`;
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

async function proposePeace(targetCountry, type) {
    const myCountry = GameData.gameState.currentCountry;
    const war = GameData.wars.find(w => 
        (w.attacker === myCountry && w.defender === targetCountry) || 
        (w.attacker === targetCountry && w.defender === myCountry)
    );
    if (!war) return alert('Không có chiến tranh!');

    const targetPlayerId = Object.keys(GameData.players).find(id => 
        GameData.players[id]?.country === targetCountry
    );

    let message = '';
    let peaceTerms = {};

    switch(type) {
        case 'whitePeace':
            message = `☮️ ${COUNTRIES[myCountry]?.name} đề xuất hòa bình trắng với ${COUNTRIES[targetCountry]?.name}`;
            peaceTerms = { type: 'whitePeace' };
            break;
        case 'reparations':
            if (GameData.resources.gold < 200) return alert('Không đủ vàng để bồi thường!');
            GameData.resources.gold -= 200;
            peaceTerms = { type: 'reparations', amount: 200 };
            message = `💰 ${COUNTRIES[myCountry]?.name} đề xuất bồi thường 200 vàng cho ${COUNTRIES[targetCountry]?.name}`;
            break;
        case 'territory':
            const defenderProvinces = Object.entries(GameData.provinces).filter(([id, p]) => p.country === targetCountry);
            if (defenderProvinces.length === 0) return alert('Đối phương không còn lãnh thổ!');
            const randomProv = defenderProvinces[Math.floor(Math.random() * defenderProvinces.length)];
            peaceTerms = { type: 'territory', provinceId: randomProv[0] };
            message = `📍 ${COUNTRIES[myCountry]?.name} đề xuất nhượng bộ ${randomProv[1].name}`;
            break;
        case 'surrender':
            const provinces = Object.entries(GameData.provinces).filter(([id, p]) => p.country === targetCountry);
            if (provinces.length < 2) return alert('Đối phương không đủ lãnh thổ!');
            const surrendered = provinces.slice(0, 2).map(([id]) => id);
            peaceTerms = { type: 'surrender', provinceIds: surrendered };
            message = `🏳️ ${COUNTRIES[myCountry]?.name} yêu cầu ${COUNTRIES[targetCountry]?.name} đầu hàng (mất 2 tỉnh)`;
            break;
    }

    // Lưu đề xuất hòa bình
    if (!war.peaceOffers) war.peaceOffers = [];
    war.peaceOffers.push({
        from: myCountry,
        to: targetCountry,
        terms: peaceTerms,
        timestamp: Date.now(),
        status: 'pending'
    });

    await update(ref(database, `games/${CONFIG.GAME_ID}/wars`), GameData.wars);
    await update(ref(database, `games/${CONFIG.GAME_ID}/resources`), GameData.resources);
    
    alert(`📨 Đã gửi đề xuất hòa bình đến ${COUNTRIES[targetCountry]?.name}!`);
    closeModal('peaceModal');
    showDiplomacy();
}

// -------- CHẤP NHẬN HÒA BÌNH --------
async function acceptPeace(warIndex, offerIndex) {
    const war = GameData.wars[warIndex];
    if (!war) return;
    const offer = war.peaceOffers[offerIndex];
    if (!offer) return;

    const myCountry = GameData.gameState.currentCountry;
    const opponent = war.attacker === myCountry ? war.defender : war.attacker;

    // Áp dụng điều khoản
    switch(offer.terms.type) {
        case 'whitePeace':
            // Không làm gì
            break;
        case 'reparations':
            GameData.resources.gold += offer.terms.amount || 0;
            break;
        case 'territory':
            if (offer.terms.provinceId) {
                GameData.provinces[offer.terms.provinceId].country = myCountry;
            }
            break;
        case 'surrender':
            (offer.terms.provinceIds || []).forEach(id => {
                if (GameData.provinces[id]) {
                    GameData.provinces[id].country = myCountry;
                }
            });
            break;
    }

    // Kết thúc chiến tranh
    war.active = false;
    war.endedAt = Date.now();
    war.peaceTerms = offer.terms;

    // Lưu vào lịch sử hòa bình
    GameData.peaceTreaties.push({
        between: [war.attacker, war.defender],
        terms: offer.terms,
        signedAt: Date.now()
    });

    await update(ref(database, `games/${CONFIG.GAME_ID}/wars`), GameData.wars);
    await update(ref(database, `games/${CONFIG.GAME_ID}/resources`), GameData.resources);
    await update(ref(database, `games/${CONFIG.GAME_ID}/provinces`), GameData.provinces);
    await update(ref(database, `games/${CONFIG.GAME_ID}/peaceTreaties`), GameData.peaceTreaties);

    alert(`☮️ Đã chấp nhận hòa bình với ${COUNTRIES[opponent]?.name}!`);
    showDiplomacy();
}

// ============== RENDER BẢN ĐỒ ==============
function renderMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', CONFIG.MAP_SIZE.width);
    svg.setAttribute('height', CONFIG.MAP_SIZE.height);
    svg.style.cssText = 'border:2px solid #333; border-radius:8px; background:#1a3a5a;';

    Object.entries(GameData.provinces).forEach(([id, province]) => {
        const color = COUNTRIES[province.country]?.color || '#666';
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const size = 30 + Math.random() * 15;
        rect.setAttribute('x', province.x - size/2);
        rect.setAttribute('y', province.y - size/2);
        rect.setAttribute('width', size);
        rect.setAttribute('height', size);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('rx', '2');
        rect.dataset.province = id;
        rect.addEventListener('click', () => selectProvince(id));
        svg.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', province.x);
        text.setAttribute('y', province.y - 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '6');
        text.textContent = province.name.substring(0, 8);
        svg.appendChild(text);

        const totalUnits = Object.values(province.units || {}).reduce((a,b) => a+b, 0);
        const unitsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        unitsText.setAttribute('x', province.x);
        unitsText.setAttribute('y', province.y + 10);
        unitsText.setAttribute('text-anchor', 'middle');
        unitsText.setAttribute('fill', '#ffdd44');
        unitsText.setAttribute('font-size', '7');
        unitsText.textContent = totalUnits > 0 ? `🪖${totalUnits}` : '';
        svg.appendChild(unitsText);
    });

    mapContainer.appendChild(svg);
}

function updateUI() {
    document.getElementById('turnDisplay').textContent = GameData.gameState.turn;
    document.getElementById('goldDisplay').textContent = GameData.resources.gold;
    document.getElementById('manpowerDisplay').textContent = GameData.resources.manpower;
    document.getElementById('oilDisplay').textContent = GameData.resources.oil;

    const indicator = document.getElementById('turnIndicator');
    if (GameData.gameState.isMyTurn) {
        indicator.textContent = '🎯 Lượt của bạn!';
        indicator.style.color = '#44ff88';
    } else {
        indicator.textContent = '⏳ Đợi lượt...';
        indicator.style.color = '#ffdd44';
    }

    // Cập nhật số lượng chiến tranh
    const warCount = GameData.wars.filter(w => w.active).length;
    document.getElementById('warCountDisplay').textContent = warCount;
}

function selectProvince(provinceId) {
    GameData.gameState.selectedProvince = provinceId;
    const province = GameData.provinces[provinceId];
    const info = document.getElementById('provinceInfo');
    if (!province) return;

    const unitsList = Object.entries(province.units || {}).map(([type, count]) => {
        const unitDef = findUnitDef(type);
        return `<li>${unitDef?.name || type}: ${count}</li>`;
    }).join('');

    const isMyProvince = province.country === GameData.gameState.currentCountry;

    info.innerHTML = `
        <h3>📍 ${province.name}</h3>
        <p><strong>Quốc gia:</strong> ${COUNTRIES[province.country]?.name || province.country}</p>
        <p><strong>Phát triển:</strong> ${province.development}</p>
        <p><strong>Dân số:</strong> ${(province.population || 0).toLocaleString()}</p>
        <p><strong>Tổng quân:</strong> ${Object.values(province.units || {}).reduce((a,b) => a+b, 0)}</p>
        <ul style="list-style:none; padding:0;">${unitsList}</ul>
        ${isMyProvince ? `<button onclick="showRecruitMenu('${provinceId}')" ${GameData.gameState.isMyTurn ? '' : 'disabled'}>🪖 Tuyển quân</button>` : ''}
        <button onclick="showTechTree()" style="margin-left:5px;">🧬 Công nghệ</button>
        <button onclick="showDiplomacy()" style="margin-left:5px;">🌍 Ngoại giao</button>
    `;
}

function findUnitDef(type) {
    for (const cat of Object.values(UNITS_DATA.unitTypes)) {
        if (cat.categories && cat.categories[type]) return cat.categories[type];
    }
    return null;
}

// ============== TUYỂN QUÂN ==============
window.showRecruitMenu = function(provinceId) {
    const province = GameData.provinces[provinceId];
    if (!province) return;
    const currentTotal = Object.values(province.units).reduce((a,b) => a+b, 0);
    const capacity = 1000;

    let html = `<h3>🪖 Tuyển quân tại ${province.name}</h3>
        <p>Sức chứa: ${currentTotal}/${capacity}</p>
        <p>💰 ${GameData.resources.gold} | 👤 ${GameData.resources.manpower} | 🛢️ ${GameData.resources.oil}</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:400px; overflow-y:auto;">`;

    Object.entries(UNITS_DATA.unitTypes).forEach(([cat, catData]) => {
        Object.entries(catData.categories).forEach(([unitKey, unit]) => {
            const canAfford = GameData.resources.gold >= (unit.cost.gold || 0) &&
                             GameData.resources.manpower >= (unit.cost.manpower || 0);
            const isUnlocked = !unit.techRequired || GameData.techLevels[GameData.playerId]?.[unit.techRequired];
            
            html += `<div style="border:1px solid #444; padding:8px; border-radius:4px; ${!canAfford || !isUnlocked ? 'opacity:0.5;' : ''}">
                <strong>${unit.name}</strong><br>
                ⚔️${unit.baseStats.attack} 🛡️${unit.baseStats.defense} ❤️${unit.baseStats.hp}<br>
                💰${unit.cost.gold||0} 👤${unit.cost.manpower||0} ${unit.cost.oil ? '🛢️'+unit.cost.oil : ''}
                <input type="number" id="qty_${unitKey}" value="100" min="1" max="500" style="width:60px; display:block; margin:5px 0;">
                <button onclick="recruitUnits('${provinceId}', '${unitKey}')" ${!canAfford || !isUnlocked ? 'disabled' : ''}>
                    Tuyển ${!isUnlocked ? '(🔒)' : ''}
                </button>
                ${unit.techRequired ? `<div style="font-size:10px; color:#888;">🔬 ${TECH_TREE[unit.techRequired]?.name || unit.techRequired}</div>` : ''}
            </div>`;
        });
    });

    html += `</div><button onclick="closeModal('recruitModal')" style="margin-top:10px;">Đóng</button>`;
    document.getElementById('recruitContent').innerHTML = html;
    document.getElementById('recruitModal').style.display = 'block';
};

window.recruitUnits = async function(provinceId, unitType) {
    if (!GameData.gameState.isMyTurn) {
        alert('Chưa đến lượt bạn!');
        return;
    }

    const province = GameData.provinces[provinceId];
    const qtyInput = document.getElementById(`qty_${unitType}`);
    const quantity = parseInt(qtyInput?.value) || 100;
    if (quantity <= 0) return alert('Số lượng phải > 0');

    const unitDef = findUnitDef(unitType);
    if (!unitDef) return alert('Không tìm thấy đơn vị!');

    const currentTotal = Object.values(province.units).reduce((a,b) => a+b, 0);
    if (currentTotal + quantity > 1000) return alert('Vượt quá sức chứa!');

    const goldCost = (unitDef.cost.gold || 0) * quantity;
    const manpowerCost = (unitDef.cost.manpower || 0) * quantity;
    const oilCost = (unitDef.cost.oil || 0) * quantity;
    
    if (GameData.resources.gold < goldCost) return alert(`Cần ${goldCost} vàng!`);
    if (GameData.resources.manpower < manpowerCost) return alert(`Cần ${manpowerCost} nhân lực!`);
    if (GameData.resources.oil < oilCost) return alert(`Cần ${oilCost} dầu!`);

    GameData.resources.gold -= goldCost;
    GameData.resources.manpower -= manpowerCost;
    GameData.resources.oil -= oilCost;
    if (!province.units[unitType]) province.units[unitType] = 0;
    province.units[unitType] += quantity;

    GameData.isSyncing = true;
    await update(ref(database, `games/${CONFIG.GAME_ID}`), {
        resources: GameData.resources,
        provinces: GameData.provinces
    });
    GameData.isSyncing = false;

    alert(`✅ Đã tuyển ${quantity} ${unitDef.name}`);
    updateUI();
    renderMap();
    showRecruitMenu(provinceId);
};

// ============== CÔNG NGHỆ ==============
window.showTechTree = function() {
    const modal = document.getElementById('techModal');
    const content = document.getElementById('techContent');
    let html = `<h3>🧬 Cây Công Nghệ</h3>
        <p>💰 Vàng: ${GameData.resources.gold}</p>
        <div style="max-height:500px; overflow-y:auto;">`;

    Object.entries(TECH_TREE).forEach(([techId, tech]) => {
        const researched = GameData.techLevels[GameData.playerId]?.[techId] || false;
        const canResearch = GameData.resources.gold >= tech.cost && !researched;
        const requirementsMet = !tech.requires || tech.requires.every(req => GameData.techLevels[GameData.playerId]?.[req]);
        
        html += `<div style="border:1px solid #444; padding:12px; margin:8px 0; border-radius:4px; ${researched ? 'background:#1a3a1a;' : ''}">
            <strong>${tech.name}</strong>
            <div style="font-size:12px; color:#aaa;">${tech.description}</div>
            <div>💰 ${tech.cost} vàng ${tech.requires ? `| Yêu cầu: ${tech.requires.map(r => TECH_TREE[r]?.name || r).join(', ')}` : ''}</div>
            <button onclick="researchTech('${techId}')" ${!canResearch || !requirementsMet ? 'disabled' : ''}>
                ${researched ? '✅ Đã nghiên cứu' : requirementsMet ? '🔬 Nghiên cứu' : '🔒 Khóa'}
            </button>
        </div>`;
    });

    html += `</div><button onclick="closeModal('techModal')">Đóng</button>`;
    content.innerHTML = html;
    modal.style.display = 'block';
};

window.researchTech = async function(techId) {
    const tech = TECH_TREE[techId];
    if (!tech) return;
    if (GameData.resources.gold < tech.cost) return alert(`Cần ${tech.cost} vàng!`);

    if (tech.requires) {
        for (const req of tech.requires) {
            if (!GameData.techLevels[GameData.playerId]?.[req]) {
                return alert(`Cần nghiên cứu "${TECH_TREE[req]?.name || req}" trước!`);
            }
        }
    }

    GameData.resources.gold -= tech.cost;
    if (!GameData.techLevels[GameData.playerId]) GameData.techLevels[GameData.playerId] = {};
    GameData.techLevels[GameData.playerId][techId] = true;

    GameData.isSyncing = true;
    await update(ref(database, `games/${CONFIG.GAME_ID}`), {
        resources: GameData.resources,
        techLevels: GameData.techLevels
    });
    GameData.isSyncing = false;

    alert(`🧪 Đã nghiên cứu ${tech.name}!`);
    updateUI();
    showTechTree();
};

// ============== HÀM ĐÓNG MODAL ==============
window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

// ============== TẠO UI ==============
document.body.innerHTML = `
    <div id="loading" style="text-align:center; padding:50px;"><h2>🔄 Đang tải...</h2><div class="loader"></div></div>
    <div id="mainMenu" style="display:none; text-align:center; padding:50px;">
        <h1>🎮 Age of History - Multiplayer</h1>
        <div style="margin:30px 0;">
            <input type="text" id="nicknameInput" placeholder="Nhập biệt danh..." style="padding:10px; width:200px;">
            <button onclick="loginWithNickname(document.getElementById('nicknameInput').value)" style="padding:10px 20px;">🔐 Đăng nhập</button>
        </div>
        <div id="gameMenu" style="display:none;">
            <h3>🌍 Chọn quốc gia</h3>
            <select id="countrySelect" style="padding:10px; width:250px;"></select>
            <div style="margin-top:20px;">
                <button onclick="createGame()" style="padding:15px 30px; margin:10px;">🚀 Tạo phòng</button>
                <br>
                <input type="text" id="gameIdInput" placeholder="Nhập mã phòng" style="padding:10px; width:200px; margin-top:10px;">
                <button onclick="joinGame(document.getElementById('gameIdInput').value)" style="padding:10px 20px;">🔗 Tham gia</button>
            </div>
        </div>
    </div>
    <div id="lobbyContainer" style="display:none;"></div>
    <div id="gameContainer" style="display:none; flex-direction:row; gap:20px; padding:20px;">
        <div id="leftPanel" style="flex:3;">
            <div id="topBar" style="display:flex; gap:10px; padding:10px; background:#2a2a2a; border-radius:8px; flex-wrap:wrap; align-items:center;">
                <span>🔄 Turn: <span id="turnDisplay">0</span></span>
                <span>💰 <span id="goldDisplay">0</span></span>
                <span>👤 <span id="manpowerDisplay">0</span></span>
                <span>🛢️ <span id="oilDisplay">0</span></span>
                <span>⚔️ War: <span id="warCountDisplay">0</span></span>
                <span id="turnIndicator" style="color:#ffdd44;">⏳ Đợi lượt...</span>
                <button onclick="showDiplomacy()" style="background:#4a6a8a;">🌍 Ngoại giao</button>
                <button onclick="showTechTree()" style="background:#4a6a8a;">🧬 Công nghệ</button>
            </div>
            <div id="mapContainer" style="background:#1a3a5a; border-radius:8px; padding:10px;"></div>
        </div>
        <div id="rightPanel" style="flex:1; min-width:280px;">
            <div id="provinceInfo" style="background:#2a2a2a; padding:15px; border-radius:8px; min-height:200px;">
                <p style="color:#888;">Chọn một tỉnh</p>
            </div>
        </div>
    </div>
    <div id="recruitModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000; overflow-y:auto;">
        <div style="background:#1a1a2e; max-width:800px; margin:50px auto; padding:20px; border-radius:8px;"><div id="recruitContent"></div></div>
    </div>
    <div id="techModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
        <div style="background:#1a1a2e; max-width:600px; margin:50px auto; padding:20px; border-radius:8px;"><div id="techContent"></div></div>
    </div>
    <div id="diplomacyModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
        <div style="background:#1a1a2e; max-width:700px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
            <div id="diplomacyContent"></div>
        </div>
    </div>
    <div id="peaceModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
        <div style="background:#1a1a2e; max-width:600px; margin:50px auto; padding:20px; border-radius:8px;">
            <div id="peaceContent"></div>
        </div>
    </div>
    <style>
        body { background:#0a0a1a; color:#fff; font-family:Arial; margin:0; padding:20px; }
        button { background:#4a6a8a; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; }
        button:hover:not(:disabled) { background:#5a7a9a; }
        button:disabled { opacity:0.4; cursor:not-allowed; }
        .loader { border:4px solid #4a6a8a; border-top:4px solid #ffdd44; border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin:20px auto; }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
        input, select { background:#1a1a2e; color:#fff; border:1px solid #4a6a8a; border-radius:4px; padding:8px; }
        #mapContainer svg { width:100%; height:auto; }
        .modal { z-index:1000; }
    </style>
`;

console.log('🎮 Game loaded!');
