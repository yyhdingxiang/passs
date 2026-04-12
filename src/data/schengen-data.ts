export type ScenicItem = [string, string, string, string];

export const schengenCountries = [
  "奥地利", "比利时", "捷克", "丹麦", "爱沙尼亚", "芬兰", "法国", "德国", "希腊", "匈牙利",
  "冰岛", "意大利", "拉脱维亚", "列支敦士登", "立陶宛", "卢森堡", "马耳他", "荷兰", "挪威",
  "波兰", "葡萄牙", "斯洛伐克", "斯洛文尼亚", "西班牙", "瑞典", "瑞士"
];

export const countryCityMap: Record<string, string[]> = {
  中国: ["北京", "上海", "广州", "深圳", "成都", "杭州", "重庆", "南京", "武汉", "西安", "苏州", "天津"],
  奥地利: ["维也纳", "萨尔茨堡", "因斯布鲁克", "格拉茨", "林茨"],
  比利时: ["布鲁塞尔", "布鲁日", "根特", "安特卫普", "列日"],
  捷克: ["布拉格", "布尔诺", "卡罗维发利", "俄斯特拉发", "奥洛穆茨"],
  丹麦: ["哥本哈根", "欧登塞", "奥胡斯", "奥尔堡", "罗斯基勒"],
  爱沙尼亚: ["塔林", "塔尔图", "帕尔努", "纳尔瓦", "哈普萨卢"],
  芬兰: ["赫尔辛基", "图尔库", "坦佩雷", "罗瓦涅米", "奥卢"],
  法国: ["巴黎", "里昂", "马赛", "尼斯", "图卢兹", "波尔多"],
  德国: ["柏林", "慕尼黑", "法兰克福", "汉堡", "科隆"],
  希腊: ["雅典", "塞萨洛尼基", "圣托里尼", "伊拉克利翁", "帕特雷"],
  匈牙利: ["布达佩斯", "德布勒森", "塞格德", "佩奇", "杰尔"],
  冰岛: ["雷克雅未克", "阿库雷里", "凯夫拉维克", "维克", "赫本"],
  意大利: ["罗马", "米兰", "佛罗伦萨", "威尼斯", "那不勒斯", "都灵", "博洛尼亚", "比萨", "维罗纳", "锡耶纳", "热那亚", "巴里", "奥尔蒂塞伊"],
  拉脱维亚: ["里加", "尤尔马拉", "陶格夫匹尔斯", "利耶帕亚", "文茨皮尔斯"],
  列支敦士登: ["瓦杜兹", "沙恩", "特里森", "巴尔策斯", "毛伦"],
  立陶宛: ["维尔纽斯", "考纳斯", "克莱佩达", "希奥利艾", "帕内韦日斯"],
  卢森堡: ["卢森堡市", "埃施", "迪弗当日", "维安登", "埃希特纳赫"],
  马耳他: ["瓦莱塔", "斯利马", "圣朱利安斯", "姆迪纳", "戈佐岛维多利亚"],
  荷兰: ["阿姆斯特丹", "鹿特丹", "海牙", "乌得勒支", "埃因霍温"],
  挪威: ["奥斯陆", "卑尔根", "特隆赫姆", "斯塔万格", "特罗姆瑟"],
  波兰: ["华沙", "克拉科夫", "格但斯克", "弗罗茨瓦夫", "波兹南"],
  葡萄牙: ["里斯本", "波尔图", "法鲁", "科英布拉", "布拉加"],
  斯洛伐克: ["布拉迪斯拉发", "科希策", "日利纳", "特伦钦", "波普拉德"],
  斯洛文尼亚: ["卢布尔雅那", "布莱德", "马里博尔", "皮兰", "科佩尔"],
  西班牙: ["马德里", "巴塞罗那", "塞维利亚", "瓦伦西亚", "马拉加"],
  瑞典: ["斯德哥尔摩", "哥德堡", "马尔默", "乌普萨拉", "林雪平"],
  瑞士: ["苏黎世", "日内瓦", "卢塞恩", "因特拉肯", "伯尔尼"]
};

export const italianRegions: Record<string, string[]> = {
  拉齐奥: ["罗马", "蒂沃利", "奇维塔韦基亚"],
  伦巴第: ["米兰", "贝加莫", "科莫"],
  托斯卡纳: ["佛罗伦萨", "比萨", "锡耶纳"],
  威尼托: ["威尼斯", "维罗纳", "帕多瓦"],
  皮埃蒙特: ["都灵", "阿尔巴", "阿斯蒂"],
  "艾米利亚-罗马涅": ["博洛尼亚", "帕尔马", "摩德纳"],
  坎帕尼亚: ["那不勒斯", "萨莱诺", "阿马尔菲"],
  利古里亚: ["热那亚", "拉斯佩齐亚", "圣雷莫"],
  普利亚: ["巴里", "莱切", "阿尔贝罗贝洛"],
  "特伦蒂诺-上阿迪杰": ["博尔扎诺", "特伦托", "奥尔蒂塞伊"]
};

export const scenicMap: Record<string, ScenicItem[]> = {
  罗马: [
    ["罗马斗兽场", "Colosseum", "2.0公里", "约18欧元/人"], ["古罗马广场", "Roman Forum", "1.9公里", "约18欧元/人"],
    ["万神殿", "Pantheon", "0.8公里", "免费"], ["特莱维喷泉", "Trevi Fountain", "0.9公里", "免费"],
    ["西班牙广场", "Spanish Steps", "1.2公里", "免费"], ["纳沃纳广场", "Piazza Navona", "0.7公里", "免费"],
    ["梵蒂冈博物馆", "Vatican Museums", "3.2公里", "约20欧元/人"], ["圣彼得大教堂", "St. Peter's Basilica", "3.1公里", "免费"],
    ["圣天使堡", "Castel Sant'Angelo", "2.5公里", "约15欧元/人"], ["博尔盖塞美术馆", "Borghese Gallery", "2.8公里", "约17欧元/人"],
    ["真理之口", "Bocca della Verità", "2.1公里", "免费"], ["人民广场", "Piazza del Popolo", "1.6公里", "免费"],
    ["卡拉卡拉浴场", "Baths of Caracalla", "3.7公里", "约10欧元/人"], ["图拉真市场", "Trajan's Market", "1.8公里", "约13欧元/人"],
    ["天使与殉教者圣母大殿", "Basilica of St. Mary of the Angels", "1.9公里", "免费"], ["阿庇亚古道公园", "Appian Way Park", "6.0公里", "免费"]
  ],
  米兰: [
    ["米兰大教堂", "Duomo di Milano", "0.4公里", "约15欧元/人"], ["埃马努埃莱二世长廊", "Galleria Vittorio Emanuele II", "0.3公里", "免费"],
    ["斯福尔扎城堡", "Sforza Castle", "1.3公里", "约5欧元/人"], ["森皮奥内公园", "Sempione Park", "1.5公里", "免费"],
    ["布雷拉美术馆", "Pinacoteca di Brera", "1.0公里", "约15欧元/人"], ["最后的晚餐", "The Last Supper", "2.0公里", "约15欧元/人"],
    ["纳维利运河区", "Navigli District", "2.6公里", "免费"], ["和平门", "Arco della Pace", "1.8公里", "免费"],
    ["现代艺术馆", "GAM Milano", "1.9公里", "约10欧元/人"], ["圣西罗球场", "San Siro Stadium", "5.5公里", "约30欧元/人"],
    ["垂直森林", "Bosco Verticale", "2.7公里", "免费"], ["米兰公墓纪念园", "Monumental Cemetery", "3.1公里", "免费"],
    ["布宜诺斯艾利斯大街", "Corso Buenos Aires", "2.9公里", "免费"], ["雷奥纳多科学技术博物馆", "Leonardo da Vinci Museum of Science and Technology", "2.2公里", "约12欧元/人"],
    ["二十世纪博物馆", "Museo del Novecento", "0.5公里", "约10欧元/人"]
  ],
  佛罗伦萨: [
    ["圣母百花大教堂", "Cathedral of Santa Maria del Fiore", "0.3公里", "免费"], ["乌菲兹美术馆", "Uffizi Gallery", "0.6公里", "约25欧元/人"],
    ["老桥", "Ponte Vecchio", "0.7公里", "免费"], ["领主广场", "Piazza della Signoria", "0.5公里", "免费"],
    ["学院美术馆", "Accademia Gallery", "0.8公里", "约16欧元/人"], ["米开朗基罗广场", "Piazzale Michelangelo", "1.8公里", "免费"],
    ["皮蒂宫", "Pitti Palace", "1.2公里", "约16欧元/人"], ["波波里花园", "Boboli Gardens", "1.4公里", "约11欧元/人"],
    ["圣十字教堂", "Basilica of Santa Croce", "1.0公里", "约8欧元/人"], ["中央市场", "Mercato Centrale", "1.1公里", "免费"],
    ["新圣母玛利亚教堂", "Santa Maria Novella", "0.9公里", "约7欧元/人"], ["共和广场", "Piazza della Repubblica", "0.4公里", "免费"],
    ["巴杰罗美术馆", "Bargello Museum", "0.7公里", "约12欧元/人"], ["圣洛伦佐教堂", "Basilica of San Lorenzo", "0.6公里", "约9欧元/人"],
    ["菲耶索莱观景点", "Fiesole Viewpoint", "7.5公里", "免费"]
  ],
  威尼斯: [
    ["圣马可广场", "Piazza San Marco", "0.2公里", "免费"], ["圣马可大教堂", "St. Mark's Basilica", "0.2公里", "约6欧元/人"],
    ["总督宫", "Doge's Palace", "0.2公里", "约30欧元/人"], ["叹息桥", "Bridge of Sighs", "0.2公里", "免费"],
    ["里亚托桥", "Rialto Bridge", "0.9公里", "免费"], ["大运河", "Grand Canal", "0.5公里", "免费"],
    ["学院美术馆", "Gallerie dell'Accademia", "1.0公里", "约15欧元/人"], ["彩色岛", "Burano", "8.0公里", "免费"],
    ["玻璃岛", "Murano", "3.5公里", "免费"], ["凤凰歌剧院", "Teatro La Fenice", "0.6公里", "约12欧元/人"],
    ["安康圣母圣殿", "Basilica di Santa Maria della Salute", "1.1公里", "免费"], ["弗拉里荣耀圣母堂", "Basilica dei Frari", "1.3公里", "约5欧元/人"],
    ["佩吉古根海姆美术馆", "Peggy Guggenheim Collection", "1.0公里", "约16欧元/人"], ["军械库区", "Arsenale", "1.7公里", "免费"],
    ["卡纳雷吉欧区", "Cannaregio", "1.8公里", "免费"]
  ]
};

export type CityAirportRegistryItem = {
  key: string;
  label: string;
  aliases?: string[];
  airports: string[];
};

export const cityAirportRegistry: CityAirportRegistryItem[] = [
  { key: "北京", label: "北京", aliases: ["北京市"], airports: ["北京首都国际机场（PEK）", "北京大兴国际机场（PKX）"] },
  { key: "上海", label: "上海", aliases: ["上海市"], airports: ["上海浦东国际机场（PVG）", "上海虹桥国际机场（SHA）"] },
  { key: "广州", label: "广州", aliases: ["广州市"], airports: ["广州白云国际机场（CAN）"] },
  { key: "深圳", label: "深圳", aliases: ["深圳市"], airports: ["深圳宝安国际机场（SZX）"] },
  { key: "成都", label: "成都", aliases: ["成都市"], airports: ["成都天府国际机场（TFU）", "成都双流国际机场（CTU）"] },
  { key: "杭州", label: "杭州", aliases: ["杭州市"], airports: ["杭州萧山国际机场（HGH）"] },
  { key: "重庆", label: "重庆", aliases: ["重庆市"], airports: ["重庆江北国际机场（CKG）"] },
  { key: "南京", label: "南京", aliases: ["南京市"], airports: ["南京禄口国际机场（NKG）"] },
  { key: "武汉", label: "武汉", aliases: ["武汉市"], airports: ["武汉天河国际机场（WUH）"] },
  { key: "西安", label: "西安", aliases: ["西安市"], airports: ["西安咸阳国际机场（XIY）"] },
  { key: "苏州", label: "苏州", aliases: ["苏州市"], airports: ["上海虹桥国际机场（SHA）"] },
  { key: "天津", label: "天津", aliases: ["天津市"], airports: ["天津滨海国际机场（TSN）"] },
  { key: "罗马", label: "罗马", airports: ["罗马菲乌米奇诺机场（FCO）", "罗马钱皮诺机场（CIA）"] },
  { key: "米兰", label: "米兰", airports: ["米兰马尔彭萨机场（MXP）", "米兰利纳特机场（LIN）"] },
  { key: "佛罗伦萨", label: "佛罗伦萨", airports: ["佛罗伦萨机场（FLR）", "比萨国际机场（PSA）"] },
  { key: "威尼斯", label: "威尼斯", airports: ["威尼斯马可波罗机场（VCE）", "特雷维索机场（TSF）"] },
  { key: "那不勒斯", label: "那不勒斯", airports: ["那不勒斯国际机场（NAP）"] },
  { key: "都灵", label: "都灵", airports: ["都灵机场（TRN）"] },
  { key: "博洛尼亚", label: "博洛尼亚", airports: ["博洛尼亚机场（BLQ）"] },
  { key: "比萨", label: "比萨", airports: ["比萨国际机场（PSA）"] },
  { key: "维罗纳", label: "维罗纳", airports: ["维罗纳机场（VRN）"] },
  { key: "锡耶纳", label: "锡耶纳", airports: ["佛罗伦萨机场（FLR）"] },
  { key: "热那亚", label: "热那亚", airports: ["热那亚机场（GOA）"] },
  { key: "巴里", label: "巴里", airports: ["巴里机场（BRI）"] },
  { key: "奥尔蒂塞伊", label: "奥尔蒂塞伊", airports: ["博尔扎诺机场（BZO）"] },
  { key: "巴黎", label: "巴黎", airports: ["巴黎戴高乐机场（CDG）", "巴黎奥利机场（ORY）"] },
  { key: "里昂", label: "里昂", airports: ["里昂圣埃克絮佩里机场（LYS）"] },
  { key: "柏林", label: "柏林", airports: ["柏林勃兰登堡机场（BER）"] },
  { key: "慕尼黑", label: "慕尼黑", airports: ["慕尼黑机场（MUC）"] },
  { key: "马德里", label: "马德里", airports: ["马德里巴拉哈斯机场（MAD）"] },
  { key: "巴塞罗那", label: "巴塞罗那", airports: ["巴塞罗那机场（BCN）"] },
  { key: "阿姆斯特丹", label: "阿姆斯特丹", airports: ["阿姆斯特丹史基浦机场（AMS）"] },
  { key: "鹿特丹", label: "鹿特丹", airports: ["鹿特丹海牙机场（RTM）"] },
  { key: "维也纳", label: "维也纳", airports: ["维也纳国际机场（VIE）"] },
  { key: "萨尔茨堡", label: "萨尔茨堡", airports: ["萨尔茨堡机场（SZG）"] },
  { key: "布拉格", label: "布拉格", airports: ["布拉格机场（PRG）"] },
  { key: "里斯本", label: "里斯本", airports: ["里斯本机场（LIS）"] },
  { key: "华沙", label: "华沙", airports: ["华沙肖邦机场（WAW）"] },
  { key: "雅典", label: "雅典", airports: ["雅典国际机场（ATH）"] }
];

export const cityAirportMap: Record<string, string[]> = Object.fromEntries(
  cityAirportRegistry.map(({ key, airports }) => [key, airports])
);

export const cityAirportAliasMap: Record<string, string> = Object.fromEntries(
  cityAirportRegistry.flatMap(({ key, label, aliases = [] }) => [key, label, ...aliases].map((name) => [name, key]))
);

export function resolveCityAirportKey(cityName: string) {
  return cityAirportAliasMap[cityName] || "";
}

export function getCityAirports(cityName: string) {
  const key = resolveCityAirportKey(cityName);
  return key ? cityAirportMap[key] || [] : [];
}

export const zhEnCity: Record<string, string> = {
  北京: "Beijing", 上海: "Shanghai", 广州: "Guangzhou", 深圳: "Shenzhen", 成都: "Chengdu", 杭州: "Hangzhou", 重庆: "Chongqing", 南京: "Nanjing", 武汉: "Wuhan", 西安: "Xi'an", 苏州: "Suzhou", 天津: "Tianjin",
  维也纳: "Vienna", 萨尔茨堡: "Salzburg", 因斯布鲁克: "Innsbruck", 格拉茨: "Graz", 林茨: "Linz",
  布鲁塞尔: "Brussels", 布鲁日: "Bruges", 根特: "Ghent", 安特卫普: "Antwerp", 列日: "Liege",
  布拉格: "Prague", 布尔诺: "Brno", 卡罗维发利: "Karlovy Vary", 俄斯特拉发: "Ostrava", 奥洛穆茨: "Olomouc",
  哥本哈根: "Copenhagen", 欧登塞: "Odense", 奥胡斯: "Aarhus", 奥尔堡: "Aalborg", 罗斯基勒: "Roskilde",
  塔林: "Tallinn", 塔尔图: "Tartu", 帕尔努: "Parnu", 纳尔瓦: "Narva", 哈普萨卢: "Haapsalu",
  赫尔辛基: "Helsinki", 图尔库: "Turku", 坦佩雷: "Tampere", 罗瓦涅米: "Rovaniemi", 奥卢: "Oulu",
  巴黎: "Paris", 里昂: "Lyon", 马赛: "Marseille", 尼斯: "Nice", 图卢兹: "Toulouse", 波尔多: "Bordeaux",
  柏林: "Berlin", 慕尼黑: "Munich", 法兰克福: "Frankfurt", 汉堡: "Hamburg", 科隆: "Cologne",
  雅典: "Athens", 塞萨洛尼基: "Thessaloniki", 圣托里尼: "Santorini", 伊拉克利翁: "Heraklion", 帕特雷: "Patras",
  布达佩斯: "Budapest", 德布勒森: "Debrecen", 塞格德: "Szeged", 佩奇: "Pecs", 杰尔: "Gyor",
  雷克雅未克: "Reykjavik", 阿库雷里: "Akureyri", 凯夫拉维克: "Keflavik", 维克: "Vik", 赫本: "Hofn",
  罗马: "Rome", 米兰: "Milan", 佛罗伦萨: "Florence", 威尼斯: "Venice", 那不勒斯: "Naples", 都灵: "Turin", 博洛尼亚: "Bologna", 比萨: "Pisa", 维罗纳: "Verona", 锡耶纳: "Siena", 热那亚: "Genoa", 巴里: "Bari", 奥尔蒂塞伊: "Ortisei",
  里加: "Riga", 尤尔马拉: "Jurmala", 陶格夫匹尔斯: "Daugavpils", 利耶帕亚: "Liepaja", 文茨皮尔斯: "Ventspils",
  瓦杜兹: "Vaduz", 沙恩: "Schaan", 特里森: "Triesen", 巴尔策斯: "Balzers", 毛伦: "Mauren",
  维尔纽斯: "Vilnius", 考纳斯: "Kaunas", 克莱佩达: "Klaipeda", 希奥利艾: "Siauliai", 帕内韦日斯: "Panevezys",
  卢森堡市: "Luxembourg City", 埃施: "Esch-sur-Alzette", 迪弗当日: "Differdange", 维安登: "Vianden", 埃希特纳赫: "Echternach",
  瓦莱塔: "Valletta", 斯利马: "Sliema", 圣朱利安斯: "St. Julian's", 姆迪纳: "Mdina", 戈佐岛维多利亚: "Victoria (Gozo)",
  阿姆斯特丹: "Amsterdam", 鹿特丹: "Rotterdam", 海牙: "The Hague", 乌得勒支: "Utrecht", 埃因霍温: "Eindhoven",
  奥斯陆: "Oslo", 卑尔根: "Bergen", 特隆赫姆: "Trondheim", 斯塔万格: "Stavanger", 特罗姆瑟: "Tromso",
  华沙: "Warsaw", 克拉科夫: "Krakow", 格但斯克: "Gdansk", 弗罗茨瓦夫: "Wroclaw", 波兹南: "Poznan",
  里斯本: "Lisbon", 波尔图: "Porto", 法鲁: "Faro", 科英布拉: "Coimbra", 布拉加: "Braga",
  布拉迪斯拉发: "Bratislava", 科希策: "Kosice", 日利纳: "Zilina", 特伦钦: "Trencin", 波普拉德: "Poprad",
  卢布尔雅那: "Ljubljana", 布莱德: "Bled", 马里博尔: "Maribor", 皮兰: "Piran", 科佩尔: "Koper",
  马德里: "Madrid", 巴塞罗那: "Barcelona", 塞维利亚: "Seville", 瓦伦西亚: "Valencia", 马拉加: "Malaga",
  斯德哥尔摩: "Stockholm", 哥德堡: "Gothenburg", 马尔默: "Malmo", 乌普萨拉: "Uppsala", 林雪平: "Linkoping",
  苏黎世: "Zurich", 日内瓦: "Geneva", 卢塞恩: "Lucerne", 因特拉肯: "Interlaken", 伯尔尼: "Bern"
};

export const crossCityTime: Record<string, string> = {
  "罗马-佛罗伦萨": "火车平均约1.5小时",
  "佛罗伦萨-威尼斯": "火车平均约2.1小时",
  "米兰-佛罗伦萨": "火车平均约1.9小时",
  "米兰-威尼斯": "火车平均约2.5小时",
  "罗马-米兰": "高铁平均约3.2小时",
  "巴黎-里昂": "高铁平均约2.0小时",
  "柏林-慕尼黑": "高铁平均约4.0小时",
  "马德里-巴塞罗那": "高铁平均约2.5小时",
  "阿姆斯特丹-鹿特丹": "火车平均约0.7小时",
  "维也纳-萨尔茨堡": "火车平均约2.5小时"
};
