"use client";

import { useEffect, useMemo, useState } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { escapeHtml } from "@/lib/html";
import { buildItineraryDocument, type ItineraryDocument, type ItineraryDocumentRow } from "@/lib/itinerary-document";
import { exportItineraryDocx } from "@/lib/itinerary-docx";
import { renderItineraryHtml } from "@/lib/itinerary-html";
import {
  advancePdfExportState,
  idlePdfExportStatus,
  openItineraryPrintWindow,
  type PdfExportStatus
} from "@/lib/itinerary-print";
import { cn } from "@/lib/utils";
import { parseCascaderSelection } from "@/lib/visa-form-options";
import { GeneratedPreview } from "@/components/visa-form/generated-preview";
import { DayCard } from "@/components/visa-form/day-card";
import { ItineraryToolbar } from "@/components/visa-form/itinerary-toolbar";
import { TripBasicsSection } from "@/components/visa-form/trip-basics-section";
import {
  crossCityTime,
  getEnglishAirportName,
  getEnglishCityName,
  getCityAirports,
  scenicMap,
  schengenCountries
} from "@/data/schengen-data";

type TabKey = "itinerary" | "letter" | "checklist";

export type CityRow = {
  city: string;
  scenics: string[];
  scenicDraft: string;
};

export type CountryRow = {
  country: string;
  cityRows: CityRow[];
  cityDraft: string;
  scenicCityDraft: string;
  scenicDraft: string;
};

type FlatCityEntry = {
  country: string;
  cityRow: CityRow;
};

export type DayItem = {
  date: string;
  countryRows: CountryRow[];
  transports: string[];
  hotelName: string;
  hotelAddress: string;
  hotelContact: string;
  flightNo: string;
  departureAirport: string;
  arrivalAirport: string;
};

export type DayHotelPatch = Partial<Pick<DayItem, "hotelName" | "hotelAddress" | "hotelContact">>;
export type DayFlightPatch = Partial<Pick<DayItem, "flightNo" | "departureAirport" | "arrivalAirport">>;

type PdfStatusViewState = PdfExportStatus & {
  visible: boolean;
  targetLabel: string;
};

const weekCN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const weekEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const travelPurposeOptions = ["旅游", "商务", "探亲", "访友", "文化交流"];
const travelPurposeEnMap: Record<string, string> = {
  旅游: "tourism",
  商务: "business",
  探亲: "family visit",
  访友: "visiting friends",
  文化交流: "cultural exchange"
};
const transportLabelEnMap: Record<string, string> = {
  飞机: "Flight",
  火车: "Train",
  汽车: "Car",
  地铁: "Metro",
  步行: "Walking",
  公交: "Bus",
  轮渡: "Ferry",
  出租车: "Taxi"
};
const guaranteeOptions = [
  "本人承诺按时回国，不逾期停留，严格遵守意大利及申根区相关法律法规。",
  "本人在中国有稳定工作与社会关系，具备充分回国约束。",
  "本人本次出行费用来源合法，已做好完整行程与预算安排。",
  "本人将按提交行程访问，不从事与签证目的不符活动。",
  "本人在中国有固定住所与长期居住安排，将按时返回居住地。",
  "本人居住证不满一年，已附上有效在华居住及工作/学习证明。",
  "本人本次出国目的明确，仅用于旅游/商务/探亲，不涉及滞留意图。"
];
const guaranteeOptionEnMap: Record<string, string> = {
  "本人承诺按时回国，不逾期停留，严格遵守意大利及申根区相关法律法规。": "I undertake to return to China on time, not overstay, and comply with the laws and regulations of Italy and the Schengen Area.",
  "本人在中国有稳定工作与社会关系，具备充分回国约束。": "I have stable employment and social ties in China, which provide sufficient incentives for me to return.",
  "本人本次出行费用来源合法，已做好完整行程与预算安排。": "The funds for this trip come from lawful sources, and I have prepared a complete itinerary and budget plan.",
  "本人将按提交行程访问，不从事与签证目的不符活动。": "I will follow the submitted itinerary and will not engage in any activities inconsistent with the purpose of my visa.",
  "本人在中国有固定住所与长期居住安排，将按时返回居住地。": "I maintain a fixed residence and long-term living arrangements in China and will return to my place of residence on time.",
  "本人居住证不满一年，已附上有效在华居住及工作/学习证明。": "Although my residence permit has been valid for less than one year, I have attached valid proof of residence and employment or study in China.",
  "本人本次出国目的明确，仅用于旅游/商务/探亲，不涉及滞留意图。": "The purpose of my trip abroad is clear and limited to tourism, business, or family visit, with no intention to remain unlawfully."
};
const materialList: Array<[string, "必备" | "可选", string]> = [
  ["护照原件及复印件", "必备", "护照有效期通常需覆盖行程结束后至少3个月"],
  ["签证申请表", "必备", "需按真实信息完整填写"],
  ["近期白底证件照", "必备", "一般为2寸白底免冠近照"],
  ["往返机票预订单", "必备", "日期需与行程单一致"],
  ["酒店预订单", "必备", "覆盖全部停留天数"],
  ["签证行程单（中英文）", "必备", "建议行程逻辑清晰、交通可执行"],
  ["签证解释信（中英文）", "可选", "建议用于说明特殊背景或补充信息"],
  ["在职证明/在校证明/退休证明", "必备", "三选一或按个人身份提供"],
  ["资产证明（银行流水、存款等）", "必备", "建议近期连续流水且余额合理"],
  ["境外医疗保险单", "必备", "保险范围需覆盖申根区与出行日期"],
  ["户口本复印件", "可选", "部分签证中心可能建议补充"]
];
const panelShellClassName = "mb-6 border border-border bg-card/95 shadow-sm";
const nativeFieldClassName = "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const pdfStatusResetDelayMs = 2500;
const visaAssistantDraftStorageKey = "visa-assistant-draft-v1";
const rewardQrStorageKey = "visa-assistant-reward-qr-v1";
const cnGeo: Record<string, Record<string, string[]>> = {
  北京市: {
    北京市: ["东城区", "西城区", "朝阳区", "海淀区", "丰台区", "通州区"]
  },
  天津市: {
    天津市: ["和平区", "河东区", "河西区", "南开区", "河北区", "武清区"]
  },
  上海市: {
    上海市: ["黄浦区", "徐汇区", "长宁区", "静安区", "浦东新区", "普陀区"]
  },
  重庆市: {
    重庆市: ["渝中区", "江北区", "南岸区", "九龙坡区", "沙坪坝区", "渝北区"]
  },
  河北省: {
    石家庄市: ["长安区", "桥西区", "新华区", "裕华区"],
    唐山市: ["路南区", "路北区", "古冶区"],
    秦皇岛市: ["海港区", "山海关区", "北戴河区"],
    邯郸市: ["邯山区", "丛台区", "复兴区"],
    保定市: ["竞秀区", "莲池区"],
    张家口市: ["桥东区", "桥西区", "宣化区"],
    承德市: ["双桥区", "双滦区"],
    沧州市: ["运河区", "新华区"],
    廊坊市: ["安次区", "广阳区"]
  },
  山西省: {
    太原市: ["小店区", "迎泽区", "杏花岭区", "万柏林区"],
    大同市: ["平城区", "云冈区"],
    长治市: ["潞州区", "上党区"],
    晋中市: ["榆次区"],
    运城市: ["盐湖区"],
    临汾市: ["尧都区"]
  },
  内蒙古自治区: {
    呼和浩特市: ["新城区", "回民区", "玉泉区", "赛罕区"],
    包头市: ["昆都仑区", "青山区", "东河区"],
    呼伦贝尔市: ["海拉尔区"],
    兴安盟: ["乌兰浩特市"],
    通辽市: ["科尔沁区"],
    赤峰市: ["红山区", "松山区"],
    锡林郭勒盟: ["锡林浩特市"],
    乌兰察布市: ["集宁区"],
    鄂尔多斯市: ["康巴什区", "东胜区"],
    巴彦淖尔市: ["临河区"],
    乌海市: ["海勃湾区"]
  },
  辽宁省: {
    沈阳市: ["和平区", "沈河区", "皇姑区", "铁西区", "大东区"],
    大连市: ["中山区", "西岗区", "沙河口区", "甘井子区"],
    鞍山市: ["铁东区", "铁西区", "立山区"],
    抚顺市: ["顺城区", "新抚区"],
    本溪市: ["平山区", "溪湖区"],
    丹东市: ["振兴区", "元宝区"],
    锦州市: ["古塔区", "凌河区", "太和区"],
    营口市: ["站前区", "西市区"],
    阜新市: ["海州区", "细河区"],
    辽阳市: ["白塔区", "文圣区"],
    盘锦市: ["兴隆台区", "双台子区"],
    铁岭市: ["银州区"],
    朝阳市: ["双塔区"],
    葫芦岛市: ["连山区", "龙港区"]
  },
  吉林省: {
    长春市: ["南关区", "朝阳区", "二道区", "绿园区"],
    吉林市: ["昌邑区", "船营区", "龙潭区", "丰满区"],
    四平市: ["铁西区", "铁东区"],
    辽源市: ["龙山区", "西安区"],
    通化市: ["东昌区"],
    白山市: ["浑江区"],
    松原市: ["宁江区"],
    白城市: ["洮北区"],
    延边朝鲜族自治州: ["延吉市"]
  },
  黑龙江省: {
    哈尔滨市: ["道里区", "南岗区", "道外区", "香坊区", "松北区"],
    齐齐哈尔市: ["龙沙区", "建华区", "铁锋区"],
    鸡西市: ["鸡冠区"],
    鹤岗市: ["向阳区", "工农区"],
    双鸭山市: ["尖山区"],
    大庆市: ["萨尔图区", "龙凤区", "让胡路区"],
    伊春市: ["伊美区"],
    佳木斯市: ["前进区", "向阳区", "东风区"],
    七台河市: ["桃山区"],
    牡丹江市: ["东安区", "阳明区", "西安区"],
    黑河市: ["爱辉区"],
    绥化市: ["北林区"],
    大兴安岭地区: ["加格达奇区"]
  },
  江苏省: {
    南京市: ["玄武区", "秦淮区", "建邺区", "鼓楼区", "浦口区"],
    无锡市: ["梁溪区", "滨湖区", "新吴区", "锡山区"],
    徐州市: ["云龙区", "鼓楼区", "贾汪区", "泉山区"],
    常州市: ["天宁区", "钟楼区", "新北区"],
    苏州市: ["姑苏区", "虎丘区", "吴中区", "相城区"],
    南通市: ["崇川区", "通州区"],
    连云港市: ["海州区", "连云区"],
    淮安市: ["清江浦区", "淮安区"],
    盐城市: ["亭湖区", "盐都区"],
    扬州市: ["广陵区", "邗江区", "江都区"],
    镇江市: ["京口区", "润州区"],
    泰州市: ["海陵区", "高港区"],
    宿迁市: ["宿城区", "宿豫区"]
  },
  浙江省: {
    杭州市: ["上城区", "下城区", "西湖区", "滨江区", "余杭区"],
    宁波市: ["海曙区", "江北区", "鄞州区", "镇海区"],
    温州市: ["鹿城区", "龙湾区", "瓯海区"],
    嘉兴市: ["南湖区", "秀洲区"],
    湖州市: ["吴兴区", "南浔区"],
    绍兴市: ["越城区", "柯桥区"],
    金华市: ["婺城区", "金东区"],
    衢州市: ["柯城区", "衢江区"],
    舟山市: ["定海区", "普陀区"],
    台州市: ["椒江区", "黄岩区", "路桥区"],
    丽水市: ["莲都区"]
  },
  安徽省: {
    合肥市: ["瑶海区", "庐阳区", "蜀山区", "包河区"],
    芜湖市: ["镜湖区", "弋江区", "鸠江区"],
    蚌埠市: ["蚌山区", "龙子湖区", "禹会区"],
    淮南市: ["田家庵区", "大通区"],
    马鞍山市: ["花山区", "雨山区"],
    淮北市: ["相山区", "杜集区"],
    铜陵市: ["铜官区", "义安区"],
    安庆市: ["迎江区", "大观区"],
    黄山市: ["屯溪区", "徽州区"],
    滁州市: ["琅琊区", "南谯区"],
    阜阳市: ["颍州区", "颍东区"],
    宿州市: ["埇桥区"],
    六安市: ["金安区", "裕安区"],
    亳州市: ["谯城区"],
    池州市: ["贵池区"],
    宣城市: ["宣州区"]
  },
  福建省: {
    福州市: ["鼓楼区", "台江区", "仓山区", "晋安区"],
    厦门市: ["思明区", "海沧区", "湖里区", "集美区"],
    莆田市: ["城厢区", "涵江区", "荔城区"],
    三明市: ["梅列区", "三元区"],
    泉州市: ["鲤城区", "丰泽区", "洛江区"],
    漳州市: ["芗城区", "龙文区"],
    南平市: ["延平区", "建阳区"],
    龙岩市: ["新罗区"],
    宁德市: ["蕉城区"]
  },
  江西省: {
    南昌市: ["东湖区", "西湖区", "青云谱区", "青山湖区"],
    景德镇市: ["珠山区", "昌江区"],
    萍乡市: ["安源区", "湘东区"],
    九江市: ["浔阳区", "濂溪区"],
    新余市: ["渝水区"],
    鹰潭市: ["月湖区"],
    赣州市: ["章贡区", "南康区"],
    吉安市: ["吉州区", "青原区"],
    宜春市: ["袁州区"],
    抚州市: ["临川区"],
    上饶市: ["信州区", "广丰区"]
  },
  山东省: {
    济南市: ["历下区", "市中区", "槐荫区", "天桥区", "历城区"],
    青岛市: ["市南区", "市北区", "黄岛区", "崂山区", "李沧区"],
    淄博市: ["淄川区", "张店区", "博山区", "临淄区"],
    枣庄市: ["市中区", "薛城区"],
    东营市: ["东营区", "河口区"],
    烟台市: ["芝罘区", "福山区", "莱山区"],
    潍坊市: ["潍城区", "奎文区"],
    济宁市: ["任城区", "兖州区"],
    泰安市: ["泰山区", "岱岳区"],
    威海市: ["环翠区"],
    日照市: ["东港区", "岚山区"],
    临沂市: ["兰山区", "罗庄区", "河东区"],
    德州市: ["德城区", "陵城区"],
    聊城市: ["东昌府区"],
    滨州市: ["滨城区", "沾化区"],
    菏泽市: ["牡丹区", "定陶区"]
  },
  河南省: {
    郑州市: ["中原区", "二七区", "管城回族区", "金水区", "惠济区"],
    开封市: ["龙亭区", "顺河回族区", "鼓楼区"],
    洛阳市: ["老城区", "西工区", "瀍河区", "涧西区"],
    平顶山市: ["新华区", "卫东区", "湛河区"],
    安阳市: ["文峰区", "北关区", "殷都区"],
    鹤壁市: ["鹤山区", "山城区", "淇滨区"],
    新乡市: ["红旗区", "卫滨区", "凤泉区"],
    焦作市: ["解放区", "中站区", "马村区", "山阳区"],
    濮阳市: ["华龙区"],
    许昌市: ["魏都区", "建安区"],
    漯河市: ["源汇区", "郾城区", "召陵区"],
    三门峡市: ["湖滨区", "陕州区"],
    南阳市: ["宛城区", "卧龙区"],
    商丘市: ["梁园区", "睢阳区"],
    信阳市: ["浉河区", "平桥区"],
    周口市: ["川汇区"],
    驻马店市: ["驿城区"]
  },
  湖北省: {
    武汉市: ["江岸区", "江汉区", "硚口区", "汉阳区", "武昌区", "洪山区"],
    黄石市: ["黄石港区", "西塞山区", "下陆区"],
    十堰市: ["茅箭区", "张湾区"],
    宜昌市: ["西陵区", "伍家岗区", "点军区"],
    襄阳市: ["襄城区", "樊城区", "襄州区"],
    鄂州市: ["鄂城区", "华容区"],
    荆门市: ["东宝区", "掇刀区"],
    孝感市: ["孝南区"],
    荆州市: ["沙市区", "荆州区"],
    黄冈市: ["黄州区"],
    咸宁市: ["咸安区"],
    随州市: ["曾都区"],
    恩施土家族苗族自治州: ["恩施市"]
  },
  湖南省: {
    长沙市: ["芙蓉区", "天心区", "岳麓区", "开福区", "雨花区"],
    株洲市: ["荷塘区", "芦淞区", "石峰区", "天元区"],
    湘潭市: ["雨湖区", "岳塘区"],
    衡阳市: ["珠晖区", "雁峰区", "石鼓区", "蒸湘区"],
    邵阳市: ["双清区", "大祥区", "北塔区"],
    岳阳市: ["岳阳楼区", "云溪区", "君山区"],
    常德市: ["武陵区", "鼎城区"],
    张家界市: ["永定区", "武陵源区"],
    益阳市: ["资阳区", "赫山区"],
    郴州市: ["北湖区", "苏仙区"],
    永州市: ["零陵区", "冷水滩区"],
    怀化市: ["鹤城区"],
    娄底市: ["娄星区"],
    湘西土家族苗族自治州: ["吉首市"]
  },
  广东省: {
    广州市: ["荔湾区", "越秀区", "海珠区", "天河区", "白云区", "黄埔区"],
    韶关市: ["武江区", "浈江区", "曲江区"],
    深圳市: ["罗湖区", "福田区", "南山区", "宝安区", "龙岗区", "龙华区"],
    珠海市: ["香洲区", "斗门区", "金湾区"],
    汕头市: ["龙湖区", "金平区", "濠江区"],
    佛山市: ["禅城区", "南海区", "顺德区", "三水区"],
    江门市: ["蓬江区", "江海区", "新会区"],
    湛江市: ["赤坎区", "霞山区", "坡头区", "麻章区"],
    茂名市: ["茂南区", "电白区"],
    肇庆市: ["端州区", "鼎湖区", "高要区"],
    惠州市: ["惠城区", "惠阳区"],
    梅州市: ["梅江区", "梅县区"],
    汕尾市: ["城区"],
    河源市: ["源城区"],
    阳江市: ["江城区", "阳东区"],
    清远市: ["清城区", "清新区"],
    东莞市: ["东莞市"],
    中山市: ["中山市"],
    潮州市: ["湘桥区"],
    揭阳市: ["榕城区", "揭东区"],
    云浮市: ["云城区"]
  },
  广西壮族自治区: {
    南宁市: ["兴宁区", "青秀区", "江南区", "西乡塘区", "良庆区"],
    柳州市: ["城中区", "鱼峰区", "柳南区", "柳北区"],
    桂林市: ["秀峰区", "叠彩区", "象山区", "七星区"],
    梧州市: ["万秀区", "长洲区"],
    北海市: ["海城区", "银海区", "铁山港区"],
    防城港市: ["港口区", "防城区"],
    钦州市: ["钦南区", "钦北区"],
    贵港市: ["港北区", "港南区"],
    玉林市: ["玉州区", "福绵区"],
    百色市: ["右江区"],
    贺州市: ["八步区"],
    河池市: ["宜州区", "金城江区"],
    来宾市: ["兴宾区"],
    崇左市: ["江州区"]
  },
  海南省: {
    海口市: ["秀英区", "龙华区", "琼山区", "美兰区"],
    三亚市: ["海棠区", "吉阳区", "天涯区", "崖州区"],
    三沙市: ["西沙区", "南沙区"],
    儋州市: ["儋州市"],
    琼海市: ["琼海市"],
    万宁市: ["万宁市"],
    东方市: ["东方市"],
    五指山市: ["五指山市"]
  },
  四川省: {
    成都市: ["锦江区", "青羊区", "金牛区", "武侯区", "成华区", "高新区"],
    自贡市: ["自流井区", "贡井区", "大安区", "沿滩区"],
    攀枝花市: ["东区", "西区", "仁和区"],
    泸州市: ["江阳区", "纳溪区", "龙马潭区"],
    德阳市: ["旌阳区", "罗江区"],
    绵阳市: ["涪城区", "游仙区"],
    广元市: ["利州区", "昭化区", "朝天区"],
    遂宁市: ["船山区", "安居区"],
    内江市: ["市中区", "东兴区"],
    乐山市: ["市中区", "沙湾区", "五通桥区", "金口河区"],
    南充市: ["顺庆区", "高坪区", "嘉陵区"],
    眉山市: ["东坡区", "彭山区"],
    宜宾市: ["翠屏区", "南溪区", "叙州区"],
    广安市: ["广安区", "前锋区"],
    达州市: ["通川区", "达川区"],
    雅安市: ["雨城区", "名山区"],
    巴中市: ["巴州区", "恩阳区"],
    资阳市: ["雁江区"],
    阿坝藏族羌族自治州: ["马尔康市"],
    甘孜藏族自治州: ["康定市"],
    凉山彝族自治州: ["西昌市"]
  },
  贵州省: {
    贵阳市: ["南明区", "云岩区", "花溪区", "乌当区", "白云区", "观山湖区"],
    六盘水市: ["钟山区", "水城区"],
    遵义市: ["红花岗区", "汇川区", "播州区"],
    安顺市: ["西秀区", "平坝区"],
    毕节市: ["七星关区"],
    铜仁市: ["碧江区", "万山区"],
    黔西南布依族苗族自治州: ["兴义市"],
    黔东南苗族侗族自治州: ["凯里市"],
    黔南布依族苗族自治州: ["都匀市"]
  },
  云南省: {
    昆明市: ["五华区", "盘龙区", "官渡区", "西山区", "呈贡区"],
    曲靖市: ["麒麟区", "沾益区", "马龙区"],
    玉溪市: ["红塔区", "江川区"],
    保山市: ["隆阳区"],
    昭通市: ["昭阳区"],
    丽江市: ["古城区"],
    普洱市: ["思茅区"],
    临沧市: ["临翔区"],
    楚雄彝族自治州: ["楚雄市"],
    红河哈尼族彝族自治州: ["蒙自市", "个旧市", "开远市"],
    文山壮族苗族自治州: ["文山市"],
    西双版纳傣族自治州: ["景洪市"],
    大理白族自治州: ["大理市"],
    德宏傣族景颇族自治州: ["芒市", "瑞丽市"],
    怒江傈僳族自治州: ["泸水市"],
    迪庆藏族自治州: ["香格里拉市"]
  },
  西藏自治区: {
    拉萨市: ["城关区", "堆龙德庆区", "达孜区"],
    日喀则市: ["桑珠孜区"],
    昌都市: ["卡若区"],
    林芝市: ["巴宜区"],
    山南市: ["乃东区"],
    那曲市: ["色尼区"],
    阿里地区: ["噶尔县"]
  },
  陕西省: {
    西安市: ["新城区", "碑林区", "莲湖区", "灞桥区", "未央区", "雁塔区"],
    铜川市: ["王益区", "印台区", "耀州区"],
    宝鸡市: ["渭滨区", "金台区", "陈仓区"],
    咸阳市: ["秦都区", "杨陵区", "渭城区"],
    渭南市: ["临渭区", "华州区"],
    延安市: ["宝塔区", "安塞区"],
    汉中市: ["汉台区", "南郑区"],
    榆林市: ["榆阳区", "横山区"],
    安康市: ["汉滨区"],
    商洛市: ["商州区"]
  },
  甘肃省: {
    兰州市: ["城关区", "七里河区", "西固区", "安宁区", "红古区"],
    嘉峪关市: ["嘉峪关市"],
    金昌市: ["金川区"],
    白银市: ["白银区", "平川区"],
    天水市: ["秦州区", "麦积区"],
    武威市: ["凉州区"],
    张掖市: ["甘州区"],
    平凉市: ["崆峒区"],
    酒泉市: ["肃州区", "玉门市", "敦煌市"],
    庆阳市: ["西峰区"],
    定西市: ["安定区"],
    陇南市: ["武都区"],
    临夏回族自治州: ["临夏市"],
    甘南藏族自治州: ["合作市"]
  },
  青海省: {
    西宁市: ["城东区", "城中区", "城西区", "城北区"],
    海东市: ["乐都区", "平安区"],
    海北藏族自治州: ["西海镇"],
    黄南藏族自治州: ["同仁市"],
    海南藏族自治州: ["共和县"],
    果洛藏族自治州: ["玛沁县"],
    玉树藏族自治州: ["玉树市"],
    海西蒙古族藏族自治州: ["德令哈市", "格尔木市"]
  },
  宁夏回族自治区: {
    银川市: ["兴庆区", "西夏区", "金凤区"],
    石嘴山市: ["大武口区", "惠农区"],
    吴忠市: ["利通区", "红寺堡区"],
    固原市: ["原州区"],
    中卫市: ["沙坡头区"]
  },
  新疆维吾尔自治区: {
    乌鲁木齐市: ["天山区", "沙依巴克区", "新市区", "水磨沟区"],
    克拉玛依市: ["独山子区", "克拉玛依区", "白碱滩区"],
    吐鲁番市: ["高昌区"],
    哈密市: ["伊州区"],
    昌吉回族自治州: ["昌吉市"],
    博尔塔拉蒙古自治州: ["博乐市"],
    巴音郭楞蒙古自治州: ["库尔勒市"],
    阿克苏地区: ["阿克苏市"],
    克孜勒苏柯尔克孜自治州: ["阿图什市"],
    喀什地区: ["喀什市"],
    和田地区: ["和田市"],
    伊犁哈萨克自治州: ["伊宁市"],
    塔城地区: ["塔城市", "乌苏市"],
    阿勒泰地区: ["阿勒泰市"]
  }
};
const defaultProvince = Object.keys(cnGeo)[0] || "";
const defaultCity = Object.keys(cnGeo[defaultProvince] || {})[0] || "";

type VisaAssistantDraft = {
  version: 1;
  tab: TabKey;
  tripStartDate: string;
  tripEndDate: string;
  applicantName: string;
  passportNo: string;
  province: string;
  city: string;
  days: DayItem[];
  zhItinerary: string;
  enItinerary: string;
  zhItineraryDocument: ItineraryDocument | null;
  enItineraryDocument: ItineraryDocument | null;
  letterName: string;
  travelPurpose: string;
  guarantees: string[];
  otherExplain: string;
  zhLetter: string;
  enLetter: string;
  checkMap: Record<number, boolean>;
};

function emptyCityRow(): CityRow {
  return {
    city: "",
    scenics: [],
    scenicDraft: ""
  };
}

function emptyCountryRow(): CountryRow {
  return {
    country: "",
    cityRows: [emptyCityRow()],
    cityDraft: "",
    scenicCityDraft: "",
    scenicDraft: ""
  };
}

function emptyDay(): DayItem {
  return {
    date: "",
    countryRows: [emptyCountryRow()],
    transports: [],
    hotelName: "",
    hotelAddress: "",
    hotelContact: "",
    flightNo: "",
    departureAirport: "",
    arrivalAirport: ""
  };
}

function emptyPdfStatusViewState(): PdfStatusViewState {
  return {
    visible: false,
    targetLabel: "",
    ...idlePdfExportStatus
  };
}

function buildInitialDraft(): VisaAssistantDraft {
  return {
    version: 1,
    tab: "itinerary",
    tripStartDate: "",
    tripEndDate: "",
    applicantName: "",
    passportNo: "",
    province: defaultProvince,
    city: defaultCity,
    days: [emptyDay()],
    zhItinerary: "",
    enItinerary: "",
    zhItineraryDocument: null,
    enItineraryDocument: null,
    letterName: "",
    travelPurpose: "旅游",
    guarantees: [],
    otherExplain: "",
    zhLetter: "",
    enLetter: "",
    checkMap: {}
  };
}

function getFirstCityForProvince(provinceName: string) {
  return Object.keys(cnGeo[provinceName] || {})[0] || defaultCity;
}

function normalizeCheckMap(value: unknown): Record<number, boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce<Record<number, boolean>>((accumulator, [key, checked]) => {
    const numericKey = Number(key);
    if (!Number.isNaN(numericKey) && typeof checked === "boolean") {
      accumulator[numericKey] = checked;
    }

    return accumulator;
  }, {});
}

function normalizeCountryRowsFromStorage(value: unknown) {
  if (!Array.isArray(value)) {
    return [emptyCountryRow()];
  }

  const entries: FlatCityEntry[] = [];

  value.forEach(rawRow => {
    if (!rawRow || typeof rawRow !== "object") {
      return;
    }

    const row = rawRow as Partial<CountryRow>;
    const country = typeof row.country === "string" ? row.country : "";
    const cityRows = Array.isArray(row.cityRows) ? row.cityRows : [];

    cityRows.forEach(rawCityRow => {
      if (!rawCityRow || typeof rawCityRow !== "object") {
        return;
      }

      const cityRow = rawCityRow as Partial<CityRow>;
      entries.push({
        country,
        cityRow: {
          city: typeof cityRow.city === "string" ? cityRow.city : "",
          scenics: Array.isArray(cityRow.scenics)
            ? cityRow.scenics.filter((item): item is string => typeof item === "string")
            : [],
          scenicDraft: typeof cityRow.scenicDraft === "string" ? cityRow.scenicDraft : ""
        }
      });
    });
  });

  return buildCountryRows(entries);
}

function normalizeDaysFromStorage(value: unknown) {
  if (!Array.isArray(value) || !value.length) {
    return [emptyDay()];
  }

  return value.map(rawDay => {
    if (!rawDay || typeof rawDay !== "object") {
      return emptyDay();
    }

    const day = rawDay as Partial<DayItem>;

    return {
      date: typeof day.date === "string" ? day.date : "",
      countryRows: normalizeCountryRowsFromStorage(day.countryRows),
      transports: Array.isArray(day.transports)
        ? day.transports.filter((item): item is string => typeof item === "string")
        : [],
      hotelName: typeof day.hotelName === "string" ? day.hotelName : "",
      hotelAddress: typeof day.hotelAddress === "string" ? day.hotelAddress : "",
      hotelContact: typeof day.hotelContact === "string" ? day.hotelContact : "",
      flightNo: typeof day.flightNo === "string" ? day.flightNo : "",
      departureAirport: typeof day.departureAirport === "string" ? day.departureAirport : "",
      arrivalAirport: typeof day.arrivalAirport === "string" ? day.arrivalAirport : ""
    };
  });
}

function normalizeItineraryDocument(value: unknown): ItineraryDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const document = value as Partial<ItineraryDocument>;
  if (document.locale !== "zh" && document.locale !== "en") {
    return null;
  }

  if (
    typeof document.title !== "string"
    || typeof document.fileName !== "string"
    || !Array.isArray(document.headerFields)
    || !Array.isArray(document.columns)
    || !Array.isArray(document.rows)
  ) {
    return null;
  }

  return {
    locale: document.locale,
    title: document.title,
    fileName: document.fileName,
    headerFields: document.headerFields.filter((field): field is { label: string; value: string } => (
      !!field
      && typeof field === "object"
      && typeof field.label === "string"
      && typeof field.value === "string"
    )),
    columns: document.columns.filter((column): column is { key: keyof ItineraryDocumentRow; label: string } => (
      !!column
      && typeof column === "object"
      && typeof column.label === "string"
      && [
        "day",
        "date",
        "city",
        "attractions",
        "accommodation",
        "transportation"
      ].includes(String(column.key))
    )),
    rows: document.rows.filter((row): row is ItineraryDocumentRow => (
      !!row
      && typeof row === "object"
      && typeof row.day === "string"
      && typeof row.date === "string"
      && typeof row.city === "string"
      && typeof row.attractions === "string"
      && typeof row.accommodation === "string"
      && typeof row.transportation === "string"
    ))
  };
}

function parseDraftFromStorage(rawDraft: string): VisaAssistantDraft | null {
  try {
    const parsed = JSON.parse(rawDraft) as Partial<VisaAssistantDraft>;
    const province = typeof parsed.province === "string" && cnGeo[parsed.province]
      ? parsed.province
      : defaultProvince;
    const city = typeof parsed.city === "string" && !!cnGeo[province]?.[parsed.city]
      ? parsed.city
      : getFirstCityForProvince(province);

    return {
      version: 1,
      tab: parsed.tab === "itinerary" || parsed.tab === "letter" || parsed.tab === "checklist"
        ? parsed.tab
        : "itinerary",
      tripStartDate: typeof parsed.tripStartDate === "string" ? parsed.tripStartDate : "",
      tripEndDate: typeof parsed.tripEndDate === "string" ? parsed.tripEndDate : "",
      applicantName: typeof parsed.applicantName === "string" ? parsed.applicantName : "",
      passportNo: typeof parsed.passportNo === "string" ? parsed.passportNo : "",
      province,
      city,
      days: normalizeDaysFromStorage(parsed.days),
      zhItinerary: typeof parsed.zhItinerary === "string" ? parsed.zhItinerary : "",
      enItinerary: typeof parsed.enItinerary === "string" ? parsed.enItinerary : "",
      zhItineraryDocument: normalizeItineraryDocument(parsed.zhItineraryDocument),
      enItineraryDocument: normalizeItineraryDocument(parsed.enItineraryDocument),
      letterName: typeof parsed.letterName === "string" ? parsed.letterName : "",
      travelPurpose: typeof parsed.travelPurpose === "string" ? parsed.travelPurpose : "旅游",
      guarantees: Array.isArray(parsed.guarantees)
        ? parsed.guarantees.filter((item): item is string => typeof item === "string")
        : [],
      otherExplain: typeof parsed.otherExplain === "string" ? parsed.otherExplain : "",
      zhLetter: typeof parsed.zhLetter === "string" ? parsed.zhLetter : "",
      enLetter: typeof parsed.enLetter === "string" ? parsed.enLetter : "",
      checkMap: normalizeCheckMap(parsed.checkMap)
    };
  } catch {
    return null;
  }
}

function cityToEn(name: string) {
  return getEnglishCityName(name);
}

function scenicToEn(name: string) {
  const scenicHit = Object.values(scenicMap).flat().find(([scenicName]) => scenicName === name);
  return scenicHit?.[1] || name;
}

function translateTimeHintToEn(timeHint: string) {
  if (!timeHint) return "";

  const matchedHighSpeedRail = timeHint.match(/^高铁平均约(.+)小时$/);
  if (matchedHighSpeedRail) {
    return `about ${matchedHighSpeedRail[1]} hours by high-speed train`;
  }

  const matchedTrain = timeHint.match(/^火车平均约(.+)小时$/);
  if (matchedTrain) {
    return `about ${matchedTrain[1]} hours by train`;
  }

  const matchedFlight = timeHint.match(/^飞机平均约(.+)小时$/);
  if (matchedFlight) {
    return `about ${matchedFlight[1]} hours by flight`;
  }

  return timeHint;
}

function flattenCountryRows(rows: CountryRow[]): FlatCityEntry[] {
  return rows.flatMap(row => row.cityRows.map(cityRow => ({
    country: row.country,
    cityRow: {
      ...cityRow,
      scenics: cityRow.city ? Array.from(new Set(cityRow.scenics.filter(Boolean))) : [],
      scenicDraft: cityRow.scenicDraft || ""
    }
  })));
}

// Keep the storage shape aligned with the current UI: each visible row maps to one country-city pair.
function buildCountryRows(entries: FlatCityEntry[]) {
  if (!entries.length) {
    return [emptyCountryRow()];
  }

  return entries.map(entry => ({
    country: entry.cityRow.city ? entry.country : "",
    cityRows: [{
      ...entry.cityRow,
      scenics: entry.cityRow.city ? Array.from(new Set(entry.cityRow.scenics.filter(Boolean))) : [],
      scenicDraft: entry.cityRow.scenicDraft || ""
    }],
    cityDraft: "",
    scenicCityDraft: "",
    scenicDraft: ""
  }));
}

function normalizeCountryRows(rows: CountryRow[]) {
  return buildCountryRows(flattenCountryRows(rows));
}

function findReusableCityRowIndex(rows: CountryRow[]) {
  return flattenCountryRows(rows).findIndex(({ cityRow }) => (
    !cityRow.city &&
    cityRow.scenics.length === 0 &&
    !cityRow.scenicDraft
  ));
}

function getFlatEntryIndex(rows: CountryRow[], countryIndex: number, cityIndex: number) {
  return rows.slice(0, countryIndex).reduce((count, row) => count + row.cityRows.length, 0) + cityIndex;
}

function formatDateCN(v: string) {
  if (!v) return "-";
  const d = new Date(v);
  return `${v}（${weekCN[d.getDay()]}）`;
}

function formatDateEN(v: string) {
  if (!v) return "-";
  const d = new Date(v);
  return `${v} (${weekEN[d.getDay()]})`;
}

function calcDates(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];
  const out: string[] = [];
  const cur = new Date(s);
  while (cur <= e) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function getRouteStops(day: DayItem) {
  const cityPoints = day.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)).filter(Boolean);
  const countryPoints = day.countryRows.map(row => row.country).filter(Boolean);
  return cityPoints.length ? cityPoints : countryPoints;
}

// The first non-empty row is treated as the day's primary city for cross-day transport hints.
function getPrimaryCity(day: DayItem) {
  return getRouteStops(day)[0] || "";
}

function getDayCities(day: DayItem) {
  return day.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)).filter(Boolean);
}

function getAllSelectedCities(days: DayItem[], departureCity: string) {
  return Array.from(
    new Set([
      ...(departureCity ? [departureCity] : []),
      ...days.flatMap(day => getDayCities(day))
    ])
  );
}

function getAirportsFromCities(cityNames: string[]) {
  const airportOptions = Array.from(
    new Set(
      cityNames.flatMap(cityName => getCityAirports(cityName))
    )
  );

  return airportOptions.length ? airportOptions : ["其他机场"];
}

function getTravelTimeHint(from: string, to: string) {
  if (!from || !to || from === to) return "";
  return crossCityTime[`${from}-${to}`] || crossCityTime[`${to}-${from}`] || "";
}

export function VisaAssistant() {
  const initialDraft = buildInitialDraft();
  const [tab, setTab] = useState<TabKey>("itinerary");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [province, setProvince] = useState(defaultProvince);
  const [city, setCity] = useState(defaultCity);
  const [days, setDays] = useState<DayItem[]>([emptyDay()]);
  const [zhItinerary, setZhItinerary] = useState("");
  const [enItinerary, setEnItinerary] = useState("");
  const [zhItineraryDocument, setZhItineraryDocument] = useState<ItineraryDocument | null>(null);
  const [enItineraryDocument, setEnItineraryDocument] = useState<ItineraryDocument | null>(null);
  const [letterName, setLetterName] = useState("");
  const [travelPurpose, setTravelPurpose] = useState("旅游");
  const [guarantees, setGuarantees] = useState<string[]>([]);
  const [otherExplain, setOtherExplain] = useState("");
  const [zhLetter, setZhLetter] = useState("");
  const [enLetter, setEnLetter] = useState("");
  const [checkMap, setCheckMap] = useState<Record<number, boolean>>({});
  const [showRewardQr, setShowRewardQr] = useState(false);
  const [rewardQrSrc, setRewardQrSrc] = useState("/reward-author-qr.png");
  const [rewardQrLoadError, setRewardQrLoadError] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<PdfStatusViewState>(emptyPdfStatusViewState());
  const [isStorageReady, setIsStorageReady] = useState(false);

  const provinces = Object.keys(cnGeo);
  const cities = useMemo(() => Object.keys(cnGeo[province] || {}), [province]);
  const countryOptions = ["中国", ...schengenCountries];
  const allSelectedCities = useMemo(() => getAllSelectedCities(days, city), [city, days]);
  const isPdfExportBusy = pdfStatus.phase === "building"
    || pdfStatus.phase === "rendering"
    || pdfStatus.phase === "printing"
    || pdfStatus.phase === "waiting";
  const showZhPdfStatus = pdfStatus.visible && pdfStatus.targetLabel === "中文 PDF";
  const showEnPdfStatus = pdfStatus.visible && pdfStatus.targetLabel === "英文 PDF";
  const updateDay = (index: number, patch: Partial<DayItem>) => {
    setDays(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const updateCountryRows = (dayIndex: number, updater: (rows: CountryRow[]) => CountryRow[]) => {
    setDays(prev => prev.map((day, index) => {
      if (index !== dayIndex) return day;
      return {
        ...day,
        countryRows: normalizeCountryRows(updater(day.countryRows))
      };
    }));
  };

  const handleProvinceChange = (nextProvince: string) => {
    const firstCity = Object.keys(cnGeo[nextProvince])[0];
    setProvince(nextProvince);
    setCity(firstCity);
  };

  const handleTripRangeChange = ({ start, end }: { start: string; end: string }) => {
    setTripStartDate(start);
    setTripEndDate(end);
  };

  const autoBuildDays = () => {
    const arr = calcDates(tripStartDate, tripEndDate);
    if (!arr.length) return;
    setDays(arr.map(date => ({ ...emptyDay(), date })));
  };

  const appendCityRow = (dayIndex: number) => {
    const currentRows = days[dayIndex]?.countryRows || [emptyCountryRow()];
    const reusableIndex = findReusableCityRowIndex(currentRows);

    if (reusableIndex >= 0) {
      return reusableIndex;
    }

    updateCountryRows(dayIndex, rows => buildCountryRows([
      ...flattenCountryRows(rows),
      {
        country: "",
        cityRow: emptyCityRow()
      }
    ]));

    return flattenCountryRows(currentRows).length;
  };

  const replaceCitySelection = (dayIndex: number, countryIndex: number, cityIndex: number, selection: string[]) => {
    const { country, city } = parseCascaderSelection(selection);
    if (!country || !city) return;

    updateCountryRows(dayIndex, rows => {
      const nextEntries = flattenCountryRows(rows);
      const entryIndex = getFlatEntryIndex(rows, countryIndex, cityIndex);
      const sourceEntry = nextEntries[entryIndex];

      if (!sourceEntry) {
        return rows;
      }

      const preservedScenics = sourceEntry.country === country && sourceEntry.cityRow.city === city
        ? sourceEntry.cityRow.scenics
        : [];

      nextEntries[entryIndex] = {
        country,
        cityRow: {
          ...sourceEntry.cityRow,
          city,
          scenics: preservedScenics
        }
      };

      return buildCountryRows(nextEntries);
    });
  };

  const removeCity = (dayIndex: number, countryIndex: number, cityIndex: number) => {
    updateCountryRows(dayIndex, rows => {
      const nextEntries = flattenCountryRows(rows);
      const entryIndex = getFlatEntryIndex(rows, countryIndex, cityIndex);

      if (entryIndex < 0 || entryIndex >= nextEntries.length) {
        return rows;
      }

      nextEntries.splice(entryIndex, 1);
      return buildCountryRows(nextEntries);
    });
  };

  const toggleScenicSelection = (dayIndex: number, countryIndex: number, cityIndex: number, scenicName: string, checked: boolean) => {
    updateCountryRows(dayIndex, rows => {
      const nextEntries = flattenCountryRows(rows);
      const entryIndex = getFlatEntryIndex(rows, countryIndex, cityIndex);
      const targetEntry = nextEntries[entryIndex];

      if (!targetEntry) {
        return rows;
      }

      const nextScenics = checked
        ? Array.from(new Set([...targetEntry.cityRow.scenics, scenicName]))
        : targetEntry.cityRow.scenics.filter(item => item !== scenicName);

      nextEntries[entryIndex] = {
        ...targetEntry,
        cityRow: {
          ...targetEntry.cityRow,
          scenics: nextScenics
        }
      };

      return buildCountryRows(nextEntries);
    });
  };

  const toggleTransport = (dayIndex: number, transport: string, checked: boolean) => {
    setDays(prev => prev.map((day, index) => {
      if (index !== dayIndex) return day;
      const transports = checked
        ? Array.from(new Set([...day.transports, transport]))
        : day.transports.filter(item => item !== transport);
      return { ...day, transports };
    }));
  };

  const getDepartureAirportCandidates = () => {
    return getAirportsFromCities(allSelectedCities);
  };

  const getArrivalAirportCandidates = () => {
    return getAirportsFromCities(allSelectedCities);
  };

  const getTimeHint = (dayIndex: number) => {
    const previousPrimaryCity = dayIndex > 0 ? getPrimaryCity(days[dayIndex - 1]) : "";
    const currentPrimaryCity = getPrimaryCity(days[dayIndex]);
    const crossDayTip = getTravelTimeHint(previousPrimaryCity, currentPrimaryCity);

    if (crossDayTip) {
      return `${previousPrimaryCity} → ${currentPrimaryCity}，${crossDayTip}`;
    }

    const routeStops = getRouteStops(days[dayIndex]);
    const previewFrom = routeStops[0] || "";
    const previewTo = routeStops[routeStops.length - 1] || "";

    if (!previewFrom || !previewTo) return "";
    const intraDayTip = getTravelTimeHint(previewFrom, previewTo);
    return intraDayTip ? `${previewFrom} → ${previewTo}，${intraDayTip}` : "";
  };

  useEffect(() => {
    try {
      const savedRewardQr = window.localStorage.getItem(rewardQrStorageKey);
      if (savedRewardQr) {
        setRewardQrSrc(savedRewardQr);
      }
    } catch {
      // Ignore storage failures and keep fallback path.
    }
  }, []);

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(visaAssistantDraftStorageKey);
    if (!rawDraft) {
      setIsStorageReady(true);
      return;
    }

    const draft = parseDraftFromStorage(rawDraft);
    if (draft) {
      setTab(draft.tab);
      setTripStartDate(draft.tripStartDate);
      setTripEndDate(draft.tripEndDate);
      setApplicantName(draft.applicantName);
      setPassportNo(draft.passportNo);
      setProvince(draft.province);
      setCity(draft.city);
      setDays(draft.days);
      setZhItinerary(draft.zhItinerary);
      setEnItinerary(draft.enItinerary);
      setZhItineraryDocument(draft.zhItineraryDocument);
      setEnItineraryDocument(draft.enItineraryDocument);
      setLetterName(draft.letterName);
      setTravelPurpose(draft.travelPurpose);
      setGuarantees(draft.guarantees);
      setOtherExplain(draft.otherExplain);
      setZhLetter(draft.zhLetter);
      setEnLetter(draft.enLetter);
      setCheckMap(draft.checkMap);
    } else {
      window.localStorage.removeItem(visaAssistantDraftStorageKey);
    }

    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    const draft: VisaAssistantDraft = {
      version: 1,
      tab,
      tripStartDate,
      tripEndDate,
      applicantName,
      passportNo,
      province,
      city,
      days,
      zhItinerary,
      enItinerary,
      zhItineraryDocument,
      enItineraryDocument,
      letterName,
      travelPurpose,
      guarantees,
      otherExplain,
      zhLetter,
      enLetter,
      checkMap
    };

    window.localStorage.setItem(visaAssistantDraftStorageKey, JSON.stringify(draft));
  }, [
    applicantName,
    checkMap,
    city,
    days,
    enItinerary,
    enItineraryDocument,
    enLetter,
    guarantees,
    isStorageReady,
    letterName,
    otherExplain,
    passportNo,
    province,
    tab,
    travelPurpose,
    tripEndDate,
    tripStartDate,
    zhItinerary,
    zhItineraryDocument,
    zhLetter
  ]);

  const handleRewardQrFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setRewardQrSrc(result);
      setRewardQrLoadError(false);
      try {
        window.localStorage.setItem(rewardQrStorageKey, result);
      } catch {
        // Ignore storage quota errors; still display for current session.
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const resetPdfStatusLater = () => {
    window.setTimeout(() => {
      setPdfStatus({
        visible: false,
        targetLabel: "",
        ...idlePdfExportStatus
      });
    }, pdfStatusResetDelayMs);
  };

  const resetDraft = () => {
    window.localStorage.removeItem(visaAssistantDraftStorageKey);
    setTab(initialDraft.tab);
    setTripStartDate(initialDraft.tripStartDate);
    setTripEndDate(initialDraft.tripEndDate);
    setApplicantName(initialDraft.applicantName);
    setPassportNo(initialDraft.passportNo);
    setProvince(initialDraft.province);
    setCity(initialDraft.city);
    setDays(initialDraft.days);
    setZhItinerary(initialDraft.zhItinerary);
    setEnItinerary(initialDraft.enItinerary);
    setZhItineraryDocument(initialDraft.zhItineraryDocument);
    setEnItineraryDocument(initialDraft.enItineraryDocument);
    setLetterName(initialDraft.letterName);
    setTravelPurpose(initialDraft.travelPurpose);
    setGuarantees(initialDraft.guarantees);
    setOtherExplain(initialDraft.otherExplain);
    setZhLetter(initialDraft.zhLetter);
    setEnLetter(initialDraft.enLetter);
    setCheckMap(initialDraft.checkMap);
    setPdfStatus(emptyPdfStatusViewState());
  };

  const buildPdfStatus = (
    phase: Exclude<PdfExportStatus["phase"], "idle">,
    targetLabel: string
  ): PdfStatusViewState => ({
    visible: true,
    targetLabel,
    ...advancePdfExportState(phase)
  });

  const generateItinerary = () => {
    const zhRows: ItineraryDocumentRow[] = [];
    const enRows: ItineraryDocumentRow[] = [];
    days.forEach((d, idx) => {
      const routeStops = getRouteStops(d);
      const previousPrimaryCity = idx > 0 ? getPrimaryCity(days[idx - 1]) : "";
      const currentPrimaryCity = getPrimaryCity(d);
      const includeCheckIn = Boolean(idx > 0 && currentPrimaryCity && previousPrimaryCity && currentPrimaryCity !== previousPrimaryCity);
      const crossDayTip = includeCheckIn ? getTravelTimeHint(previousPrimaryCity, currentPrimaryCity) : "";
      const crossDayTipEn = translateTimeHintToEn(crossDayTip);
      const depart = routeStops[0] || "-";
      const arrive = routeStops[routeStops.length - 1] || depart;
      const via = routeStops.slice(1, -1);
      const scenicRows = d.countryRows.flatMap(row => row.cityRows.filter(cityRow => cityRow.scenics.length).map(cityRow => ({ city: cityRow.city, scenics: cityRow.scenics })));
      const scenicPartsCN = scenicRows.map(row => `${row.city}：${row.scenics.join("、")}`);
      const scenicPartsEN = scenicRows.map(row => {
        const scenicNames = row.scenics.map(scenic => scenicToEn(scenic));
        return `${cityToEn(row.city)}: ${scenicNames.join(", ")}`;
      });
      if (includeCheckIn) {
        scenicPartsCN.push("办理入住");
        scenicPartsEN.push("Hotel check-in");
      }
      const scenicCN = scenicPartsCN.join("；") || "-";
      const scenicEN = scenicPartsEN.join("; ") || "-";
      const hotelCN = `酒店：${d.hotelName || "-"}；地址：${d.hotelAddress || "-"}；联系方式：${d.hotelContact || "-"}`;
      const hotelEN = `Hotel: ${d.hotelName || "-"}; Address: ${d.hotelAddress || "-"}; Contact: ${d.hotelContact || "-"}`;
      const translatedTransports = d.transports.map(transport => transportLabelEnMap[transport] || transport);
      const transCNBase = d.transports.join(" + ");
      const transENBase = translatedTransports.join(" + ");
      const flightCN = d.transports.includes("飞机")
        ? `（起飞：${d.departureAirport || "-"}；落地：${d.arrivalAirport || "-"}；航班号：${d.flightNo || "-"}）`
        : "";
      const flightEN = d.transports.includes("飞机")
        ? ` (Dep: ${d.departureAirport ? getEnglishAirportName(d.departureAirport) : "-"}; Arr: ${d.arrivalAirport ? getEnglishAirportName(d.arrivalAirport) : "-"}; Flight No.: ${d.flightNo || "-"})`
        : "";
      const intraDayTip = getTravelTimeHint(depart, arrive);
      const intraDayTipEn = translateTimeHintToEn(intraDayTip);
      const transCNParts = [
        includeCheckIn ? `跨城交通：${previousPrimaryCity} → ${currentPrimaryCity}${crossDayTip ? `（${crossDayTip}）` : ""}` : "",
        transCNBase ? `${transCNBase}${flightCN}` : "",
        !includeCheckIn && intraDayTip ? `交通参考：${intraDayTip}` : ""
      ].filter(Boolean);
      const transENParts = [
        includeCheckIn
          ? `Intercity transfer: ${cityToEn(previousPrimaryCity)} to ${cityToEn(currentPrimaryCity)}${crossDayTipEn ? ` (${crossDayTipEn})` : ""}`
          : "",
        transENBase ? `${transENBase}${flightEN}` : "",
        !includeCheckIn && intraDayTipEn ? `Travel reference: ${intraDayTipEn}` : ""
      ].filter(Boolean);
      const transCN = transCNParts.join("；") || "-";
      const transEN = transENParts.join("; ") || "-";
      const routeCN = via.length ? `${depart} → ${via.join(" → ")} → ${arrive}` : depart === arrive ? depart : `${depart} → ${arrive}`;
      const routeEN = via.length ? `${cityToEn(depart)} → ${via.map(cityToEn).join(" → ")} → ${cityToEn(arrive)}` : depart === arrive ? cityToEn(depart) : `${cityToEn(depart)} to ${cityToEn(arrive)}`;

      zhRows.push({
        day: String(idx + 1),
        date: formatDateCN(d.date),
        city: routeCN,
        attractions: scenicCN,
        accommodation: hotelCN,
        transportation: transCN
      });

      enRows.push({
        day: String(idx + 1),
        date: formatDateEN(d.date),
        city: routeEN,
        attractions: scenicEN,
        accommodation: hotelEN,
        transportation: transEN
      });
    });

    const zhDocument = buildItineraryDocument({
      applicantName,
      passportNo,
      departure: `${province}${city}`,
      locale: "zh",
      rows: zhRows
    });

    const enDocument = buildItineraryDocument({
      applicantName,
      passportNo,
      departure: `${getEnglishCityName(city)}, China`,
      locale: "en",
      rows: enRows
    });

    setZhItineraryDocument(zhDocument);
    setEnItineraryDocument(enDocument);
    setZhItinerary(renderItineraryHtml(zhDocument));
    setEnItinerary(renderItineraryHtml(enDocument));
  };

  const handleExportDocx = async (locale: "zh" | "en") => {
    const targetDocument = locale === "zh" ? zhItineraryDocument : enItineraryDocument;

    if (!targetDocument) {
      return;
    }

    await exportItineraryDocx(targetDocument);
  };

  const handleExportPdf = async (locale: "zh" | "en") => {
    const targetDocument = locale === "zh" ? zhItineraryDocument : enItineraryDocument;

    if (!targetDocument) {
      return;
    }

    const targetLabel = locale === "zh" ? "中文 PDF" : "英文 PDF";
    setPdfStatus(buildPdfStatus("building", targetLabel));

    try {
      setPdfStatus(buildPdfStatus("rendering", targetLabel));
      const printWindow = openItineraryPrintWindow(targetDocument);
      let finished = false;

      printWindow.addEventListener("afterprint", () => {
        finished = true;
        setPdfStatus(buildPdfStatus("done", targetLabel));
        printWindow.close();
        resetPdfStatusLater();
      }, { once: true });

      printWindow.addEventListener("beforeunload", () => {
        if (finished) {
          return;
        }

        setPdfStatus(buildPdfStatus("cancelled", targetLabel));
        resetPdfStatusLater();
      }, { once: true });

      setPdfStatus(buildPdfStatus("printing", targetLabel));
      printWindow.focus();
      setPdfStatus(buildPdfStatus("waiting", targetLabel));
      printWindow.print();
    } catch {
      setPdfStatus(buildPdfStatus("error", targetLabel));
      resetPdfStatusLater();
    }
  };

  const generateLetter = () => {
    const travelPurposeEn = travelPurposeEnMap[travelPurpose] || travelPurpose;
    const guaranteesEn = guarantees.map(item => guaranteeOptionEnMap[item] || item);
    const zh = `<div><strong>签证解释信（中文版）</strong></div><p>尊敬的签证官：</p><p>您好！本人${escapeHtml(letterName || "申请人")}，本次前往意大利及申根区的主要目的为${escapeHtml(travelPurpose)}。</p><p>回国保证：${guarantees.length ? guarantees.map(escapeHtml).join("；") : "本人承诺按时回国，不逾期停留。"} </p><p>其他说明：${escapeHtml(otherExplain || "无")}</p><p>申请人：${escapeHtml(letterName || "申请人")}<br/>日期：${escapeHtml(new Date().toISOString().slice(0, 10))}</p>`;
    const en = `<div><strong>Visa Explanation Letter (English)</strong></div><p>Dear Visa Officer,</p><p>My name is ${escapeHtml(letterName || "Applicant")}. The purpose of this trip is ${escapeHtml(travelPurposeEn)}.</p><p>Return Commitment: ${guaranteesEn.length ? guaranteesEn.map(escapeHtml).join("; ") : "I undertake to return on time and comply with all applicable laws."}</p><p>Additional Explanation: ${escapeHtml(otherExplain || "None.")}</p><p>Applicant: ${escapeHtml(letterName || "Applicant")}<br/>Date: ${escapeHtml(new Date().toISOString().slice(0, 10))}</p>`;
    setZhLetter(zh);
    setEnLetter(en);
  };

  const handleZhItineraryEdit = (html: string) => {
    setZhItinerary(html);
    setZhItineraryDocument(null);
  };

  const handleEnItineraryEdit = (html: string) => {
    setEnItinerary(html);
    setEnItineraryDocument(null);
  };

  return (
    <main className="mx-auto w-[min(1260px,96vw)] px-1 py-4 sm:px-0 sm:py-6 lg:w-[min(1260px,94vw)] lg:py-8">
      <BlurFade>
        <MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">申根签材料智能助理</h1>
                <p className="max-w-3xl text-sm leading-5 text-muted-foreground sm:leading-6 md:text-base">
                  用于智能生成行程单、解释信与材料清单，生成前请按实际预订单与个人材料逐项核对。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm"
                onClick={resetDraft}
              >
                重置
              </Button>
              {[
                ["itinerary", "行程单生成"],
                ["letter", "解释信生成（开发中）"],
                ["checklist", "材料清单（开发中）"]
              ].map(([k, label]) => (
                <Button
                  key={k}
                  type="button"
                  onClick={() => setTab(k as TabKey)}
                  variant={tab === k ? "default" : "outline"}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm",
                    tab !== k && "bg-card"
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      <BlurFade delayMs={80}>
        <div className="mb-4 rounded-xl border border-border bg-muted/70 px-3 py-2 text-xs font-semibold leading-5 text-muted-foreground sm:mb-6 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
          <div>免责声明：本工具仅作为签证申请材料辅助生成工具，不具备保证签证通过的效力，最终签证审核结果以领馆官方判定为准。</div>
          <div>
            意见&建议：您的任何意见与建议可通过该
            <a
              href="https://my.feishu.cn/share/base/query/shrcnZHBZWOiEqfVlCJxLgP3vqb"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              链接
            </a>
            提交，感谢您的参与
          </div>
        </div>
      </BlurFade>

      {tab === "itinerary" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-0")}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:px-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">签证行程单生成</h2>
                <p className="text-sm text-muted-foreground">按天维护路线、住宿与交通信息，下方可生成中英文效果预览。</p>
              </div>
              <ItineraryToolbar />
            </div>
            <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
              <TripBasicsSection
                applicantName={applicantName}
                onApplicantNameChange={setApplicantName}
                passportNo={passportNo}
                onPassportNoChange={setPassportNo}
                province={province}
                onProvinceChange={handleProvinceChange}
                city={city}
                onCityChange={setCity}
                provinces={provinces}
                cities={cities}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                onTripRangeChange={handleTripRangeChange}
                onAutoBuildDays={autoBuildDays}
              />

              <div className="space-y-3 sm:space-y-4">
              {days.map((d, i) => {
                return (
                  <div key={i}>
                    <DayCard
                      index={i}
                      day={d}
                      countryOptions={countryOptions}
                      departureAirportCandidates={getDepartureAirportCandidates()}
                      arrivalAirportCandidates={getArrivalAirportCandidates()}
                      timeHint={getTimeHint(i)}
                      onDateChange={value => updateDay(i, { date: value })}
                      onAddCitySelection={() => appendCityRow(i)}
                      onReplaceCitySelection={(countryIndex, cityIndex, selection) => replaceCitySelection(i, countryIndex, cityIndex, selection)}
                      onToggleScenicSelection={(countryIndex, cityIndex, scenicName, checked) => toggleScenicSelection(i, countryIndex, cityIndex, scenicName, checked)}
                      onRemoveCity={(countryIndex, cityIndex) => removeCity(i, countryIndex, cityIndex)}
                      onHotelChange={patch => updateDay(i, patch)}
                      onToggleTransport={(transport, checked) => toggleTransport(i, transport, checked)}
                      onFlightChange={patch => updateDay(i, patch)}
                    />
                  </div>
                );
              })}
              </div>

              <div className="flex justify-start">
                <Button type="button" className="h-9 px-4 text-sm sm:px-5" onClick={generateItinerary}>
                  生成中英文行程单
                </Button>
              </div>

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <GeneratedPreview
                  title="中文版（可编辑）"
                  html={zhItinerary}
                  onHtmlChange={handleZhItineraryEdit}
                  footer={(
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 text-sm"
                          disabled={!zhItineraryDocument || isPdfExportBusy}
                          onClick={() => handleExportDocx("zh")}
                        >
                          导出中文 DOCX
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 text-sm"
                          disabled={!zhItineraryDocument || isPdfExportBusy}
                          onClick={() => handleExportPdf("zh")}
                        >
                          导出中文 PDF
                        </Button>
                      </div>
                      {showZhPdfStatus ? (
                        <div className="rounded-xl border border-border bg-muted/40 p-2.5 sm:p-3">
                          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
                            <span>{pdfStatus.targetLabel}</span>
                            <span>{pdfStatus.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-border/70">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pdfStatus.phase === "error" ? "bg-destructive" : "bg-primary"
                              )}
                              style={{ width: `${pdfStatus.progress}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{pdfStatus.message}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                />
                <GeneratedPreview
                  title="英文版（可编辑）"
                  html={enItinerary}
                  onHtmlChange={handleEnItineraryEdit}
                  footer={(
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 text-sm"
                          disabled={!enItineraryDocument || isPdfExportBusy}
                          onClick={() => handleExportDocx("en")}
                        >
                          导出英文 DOCX
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 text-sm"
                          disabled={!enItineraryDocument || isPdfExportBusy}
                          onClick={() => handleExportPdf("en")}
                        >
                          导出英文 PDF
                        </Button>
                      </div>
                      {showEnPdfStatus ? (
                        <div className="rounded-xl border border-border bg-muted/40 p-2.5 sm:p-3">
                          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
                            <span>{pdfStatus.targetLabel}</span>
                            <span>{pdfStatus.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-border/70">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pdfStatus.phase === "error" ? "bg-destructive" : "bg-primary"
                              )}
                              style={{ width: `${pdfStatus.progress}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{pdfStatus.message}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "letter" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
            <div className="mb-3 space-y-1 sm:mb-4">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">签证解释信生成</h2>
              <p className="text-sm text-muted-foreground">补充个人情况与回国约束信息，生成后请按实际材料再次校对。</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="姓名" value={letterName} onChange={e => setLetterName(e.target.value)} />
              <select className={nativeFieldClassName} value={travelPurpose} onChange={e => setTravelPurpose(e.target.value)}>
                {travelPurposeOptions.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">{guaranteeOptions.map(g => (
              <label key={g} className="mb-1 block text-sm text-foreground">
                <input type="checkbox" checked={guarantees.includes(g)} onChange={e => setGuarantees(prev => (e.target.checked ? [...prev, g] : prev.filter(v => v !== g)))} /> {g}
              </label>
            ))}</div>
            <Textarea className="mt-3" placeholder="其他需解释内容" value={otherExplain} onChange={e => setOtherExplain(e.target.value)} />
            <div className="mt-3">
              <Button type="button" onClick={generateLetter}>生成中英文解释信</Button>
            </div>
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">解释信结尾需手写签名，请打印后务必手写签名再提交至领馆。</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div
                className="min-h-40 rounded-xl border border-border bg-background p-3"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: zhLetter }}
                onInput={event => setZhLetter(event.currentTarget.innerHTML)}
              />
              <div
                className="min-h-40 rounded-xl border border-border bg-background p-3"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: enLetter }}
                onInput={event => setEnLetter(event.currentTarget.innerHTML)}
              />
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "checklist" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-4 sm:p-5 lg:p-6")}>
            <div className="mb-3 space-y-1 sm:mb-4">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">签证申请材料准备清单</h2>
              <p className="text-sm text-muted-foreground">按清单核对基础材料，勾选状态仅用于当前页面辅助记录。</p>
            </div>
            <div className="space-y-2">
              {materialList.map((m, i) => (
                <label key={m[0]} className="flex items-start gap-2 rounded-xl border border-border bg-background p-2.5 sm:p-3">
                  <input type="checkbox" checked={!!checkMap[i]} onChange={e => setCheckMap(prev => ({ ...prev, [i]: e.target.checked }))} />
                  <span>
                    <strong className="text-foreground">{m[0]}</strong>{" "}
                    <Badge variant="outline" className={cn(
                      "border-border bg-muted/40 align-middle text-[11px] font-medium",
                      m[1] === "必备" ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {m[1]}
                    </Badge>
                    <div className="text-xs leading-5 text-muted-foreground">{m[2]}</div>
                  </span>
                </label>
              ))}
            </div>
          </MagicCard>
        </BlurFade>
      )}
      <div className="pt-2 text-center">
        <Button
          type="button"
          variant="default"
          size="sm"
          className={cn(
            "border-0 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg",
            showRewardQr
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          )}
          onClick={() => setShowRewardQr(prev => !prev)}
        >
          {showRewardQr ? "收起打赏二维码" : "打赏作者"}
        </Button>
        {showRewardQr && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <img
              src={rewardQrSrc}
              alt="作者收款二维码"
              className="w-full max-w-[280px] rounded-lg border border-border bg-background p-1"
              onLoad={() => setRewardQrLoadError(false)}
              onError={() => setRewardQrLoadError(true)}
            />
            {rewardQrLoadError && (
              <div className="space-y-2 text-center">
                <p className="text-xs text-muted-foreground">
                  未检测到二维码图片，请上传你的收款二维码（支持 png/jpg/webp）。
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleRewardQrFileChange}
                  className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-foreground"
                />
              </div>
            )}
            
          </div>
        )}
      </div>
      <div className="pb-4 pt-3 text-center text-xs text-muted-foreground sm:pb-6">
        该版本更新于：2026-04-13 21:12 修复了英文行程单中机场名展示错误；新增打赏作者收款码:)
      </div>
    </main>
  );
}
