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
  getCityAirports,
  scenicMap,
  schengenCountries,
  zhEnCity
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
const cnGeo: Record<string, Record<string, string[]>> = {
  四川省: { 成都市: ["锦江区", "青羊区", "武侯区"], 绵阳市: ["涪城区", "游仙区"], 乐山市: ["市中区", "沙湾区"] },
  广东省: { 广州市: ["天河区", "越秀区", "海珠区"], 深圳市: ["南山区", "福田区", "罗湖区"], 珠海市: ["香洲区", "斗门区"] },
  浙江省: { 杭州市: ["西湖区", "上城区", "滨江区"], 宁波市: ["海曙区", "江北区"], 温州市: ["鹿城区", "龙湾区"] },
  北京市: { 北京市: ["朝阳区", "海淀区", "东城区"] },
  上海市: { 上海市: ["浦东新区", "徐汇区", "静安区"] }
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
  return zhEnCity[name] || name;
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
        ? ` (Dep: ${d.departureAirport || "-"}; Arr: ${d.arrivalAirport || "-"}; Flight No.: ${d.flightNo || "-"})`
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
      departure: `${cityToEn(city)}, China`,
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
          免责声明：本工具仅作为签证申请材料辅助生成工具，不具备保证签证通过的效力，最终签证审核结果以领馆官方判定为准。
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
    </main>
  );
}
