"use client";

import { useMemo, useState } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { escapeHtml } from "@/lib/html";
import { cn } from "@/lib/utils";
import { parseCascaderSelection } from "@/lib/visa-form-options";
import { GeneratedPreview } from "@/components/visa-form/generated-preview";
import { DayCard } from "@/components/visa-form/day-card";
import { ItineraryToolbar } from "@/components/visa-form/itinerary-toolbar";
import { TripBasicsSection } from "@/components/visa-form/trip-basics-section";
import {
  cityAirportMap,
  crossCityTime,
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
const cnGeo: Record<string, Record<string, string[]>> = {
  四川省: { 成都市: ["锦江区", "青羊区", "武侯区"], 绵阳市: ["涪城区", "游仙区"], 乐山市: ["市中区", "沙湾区"] },
  广东省: { 广州市: ["天河区", "越秀区", "海珠区"], 深圳市: ["南山区", "福田区", "罗湖区"], 珠海市: ["香洲区", "斗门区"] },
  浙江省: { 杭州市: ["西湖区", "上城区", "滨江区"], 宁波市: ["海曙区", "江北区"], 温州市: ["鹿城区", "龙湾区"] },
  北京市: { 北京市: ["朝阳区", "海淀区", "东城区"] },
  上海市: { 上海市: ["浦东新区", "徐汇区", "静安区"] }
};

function emptyCountryRow(): CountryRow {
  return {
    country: "",
    cityRows: [],
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

function cityToEn(name: string) {
  return zhEnCity[name] || name;
}

function hasCountryRowContent(row: CountryRow) {
  return Boolean(row.country || row.cityRows.length);
}

function normalizeCountryRows(rows: CountryRow[]) {
  const filledRows = rows.filter(hasCountryRowContent);

  if (!filledRows.length) {
    return [emptyCountryRow()];
  }

  return [...filledRows, emptyCountryRow()];
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

function getPreviewPoints(day: DayItem) {
  const cityPoints = day.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)).filter(Boolean);
  const countryPoints = day.countryRows.map(row => row.country).filter(Boolean);
  return cityPoints.length ? cityPoints : countryPoints;
}

export function VisaAssistant() {
  const [tab, setTab] = useState<TabKey>("itinerary");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [province, setProvince] = useState(Object.keys(cnGeo)[0]);
  const [city, setCity] = useState(Object.keys(cnGeo[Object.keys(cnGeo)[0]])[0]);
  const [days, setDays] = useState<DayItem[]>([emptyDay()]);
  const [zhItinerary, setZhItinerary] = useState("");
  const [enItinerary, setEnItinerary] = useState("");
  const [letterName, setLetterName] = useState("");
  const [travelPurpose, setTravelPurpose] = useState("旅游");
  const [guarantees, setGuarantees] = useState<string[]>([]);
  const [otherExplain, setOtherExplain] = useState("");
  const [zhLetter, setZhLetter] = useState("");
  const [enLetter, setEnLetter] = useState("");
  const [checkMap, setCheckMap] = useState<Record<number, boolean>>({});

  const provinces = Object.keys(cnGeo);
  const cities = useMemo(() => Object.keys(cnGeo[province] || {}), [province]);
  const countryOptions = ["中国", ...schengenCountries];

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

  const addDay = () => setDays(prev => [...prev, emptyDay()]);

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

  const applyCascaderSelection = (dayIndex: number, selection: string[]) => {
    const { country, city, scenic } = parseCascaderSelection(selection);
    if (!country || !city) return;

    updateCountryRows(dayIndex, rows => {
      const nextRows = [...rows];
      let targetIndex = nextRows.findIndex(row => row.country === country);

      if (targetIndex === -1) {
        targetIndex = nextRows.findIndex(row => !hasCountryRowContent(row));
      }

      if (targetIndex === -1) {
        targetIndex = nextRows.length;
        nextRows.push(emptyCountryRow());
      }

      const targetRow = nextRows[targetIndex] || emptyCountryRow();
      let nextTargetRow: CountryRow = {
        ...targetRow,
        cityRows: [...targetRow.cityRows],
        country
      };

      if (city && !nextTargetRow.cityRows.some(cityRow => cityRow.city === city)) {
        nextTargetRow = {
          ...nextTargetRow,
          cityRows: [...nextTargetRow.cityRows, { city, scenics: [], scenicDraft: "" }]
        };
      }

      if (city && scenic) {
        nextTargetRow = {
          ...nextTargetRow,
          scenicCityDraft: city,
          scenicDraft: "",
          cityRows: nextTargetRow.cityRows.map(cityRow => (
            cityRow.city === city
              ? {
                  ...cityRow,
                  scenics: cityRow.scenics.includes(scenic) ? cityRow.scenics : [...cityRow.scenics, scenic]
                }
              : cityRow
          ))
        };
      }

      nextRows[targetIndex] = nextTargetRow;
      return nextRows;
    });
  };

  const removeCountryRow = (dayIndex: number, countryIndex: number) => {
    updateCountryRows(dayIndex, rows => rows.filter((_, index) => index !== countryIndex));
  };

  const removeCity = (dayIndex: number, countryIndex: number, cityIndex: number) => {
    updateCountryRows(dayIndex, rows => rows.map((row, index) => {
      if (index !== countryIndex) return row;

      const removedCityName = row.cityRows[cityIndex]?.city;
      const nextScenicCityDraft = row.scenicCityDraft === removedCityName ? "" : row.scenicCityDraft;

      return {
        ...row,
        scenicCityDraft: nextScenicCityDraft,
        scenicDraft: nextScenicCityDraft ? row.scenicDraft : "",
        cityRows: row.cityRows.filter((_, currentIndex) => currentIndex !== cityIndex)
      };
    }));
  };

  const removeScenic = (dayIndex: number, countryIndex: number, cityIndex: number, scenicIndex: number) => {
    updateCountryRows(dayIndex, rows => rows.map((row, index) => (
      index === countryIndex
        ? {
            ...row,
            cityRows: row.cityRows.map((cityRow, currentIndex) => (
              currentIndex === cityIndex
                ? { ...cityRow, scenics: cityRow.scenics.filter((_, currentScenicIndex) => currentScenicIndex !== scenicIndex) }
                : cityRow
            ))
          }
        : row
    )));
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

  const getAirportCandidates = (day: DayItem) => {
    const airportOptions = Array.from(
      new Set(
        day.countryRows
          .flatMap(row => row.cityRows.map(cityRow => cityRow.city))
          .flatMap(cityName => cityAirportMap[cityName] || [])
      )
    );

    return airportOptions.length ? airportOptions : ["其他机场"];
  };

  const getTimeHint = (day: DayItem) => {
    const previewPoints = getPreviewPoints(day);
    const previewFrom = previewPoints[0] || "";
    const previewTo = previewPoints[previewPoints.length - 1] || "";

    if (!previewFrom || !previewTo) return "";
    return crossCityTime[`${previewFrom}-${previewTo}`] || crossCityTime[`${previewTo}-${previewFrom}`] || "";
  };

  const generateItinerary = () => {
    const zhRows: string[] = [];
    const enRows: string[] = [];
    days.forEach((d, idx) => {
      const routePoints = getPreviewPoints(d);
      const depart = routePoints[0] || "-";
      const arrive = routePoints[routePoints.length - 1] || depart;
      const via = routePoints.slice(1, -1);
      const scenicRows = d.countryRows.flatMap(row => row.cityRows.filter(cityRow => cityRow.scenics.length).map(cityRow => ({ city: cityRow.city, scenics: cityRow.scenics })));
      const scenicCN = scenicRows.map(row => `${escapeHtml(row.city)}：${row.scenics.map(escapeHtml).join("、")}`).join("；") || "-";
      const scenicEN = scenicRows.map(row => {
        const scenicNames = row.scenics.map(scenic => {
          const hit = Object.values(scenicMap).flat().find(v => v[0] === scenic);
          return escapeHtml(hit?.[1] || scenic);
        });
        return `${escapeHtml(cityToEn(row.city))}: ${scenicNames.join(", ")}`;
      }).join("; ") || "-";
      const hotelCN = `酒店：${escapeHtml(d.hotelName || "-")}；地址：${escapeHtml(d.hotelAddress || "-")}；联系方式：${escapeHtml(d.hotelContact || "-")}`;
      const hotelEN = `Hotel: ${escapeHtml(d.hotelName || "-")}; Address: ${escapeHtml(d.hotelAddress || "-")}; Contact: ${escapeHtml(d.hotelContact || "-")}`;
      const translatedTransports = d.transports.map(t => escapeHtml(({ 飞机: "Flight", 火车: "Train", 汽车: "Car", 地铁: "Metro", 步行: "Walking", 公交: "Bus", 轮渡: "Ferry", 出租车: "Taxi" }[t] || t)));
      const transCNBase = d.transports.map(escapeHtml).join(" + ");
      const transENBase = translatedTransports.join(" + ");
      const flightCN = d.transports.includes("飞机")
        ? `（起飞：${escapeHtml(d.departureAirport || "-")}；落地：${escapeHtml(d.arrivalAirport || "-")}；航班号：${escapeHtml(d.flightNo || "-")}）`
        : "";
      const flightEN = d.transports.includes("飞机")
        ? ` (Dep: ${escapeHtml(d.departureAirport || "-")}; Arr: ${escapeHtml(d.arrivalAirport || "-")}; Flight No.: ${escapeHtml(d.flightNo || "-")})`
        : "";
      const transCN = (transCNBase ? `${transCNBase}${flightCN}` : "-");
      const transEN = (transENBase ? `${transENBase}${flightEN}` : "-");
      const key = `${depart}-${arrive}`;
      const rev = `${arrive}-${depart}`;
      const tip = crossCityTime[key] || crossCityTime[rev];
      const routeCN = via.length ? `${depart} → ${via.join(" → ")} → ${arrive}` : depart === arrive ? depart : `${depart} → ${arrive}`;
      const routeEN = via.length ? `${cityToEn(depart)} → ${via.map(cityToEn).join(" → ")} → ${cityToEn(arrive)}` : depart === arrive ? cityToEn(depart) : `${cityToEn(depart)} to ${cityToEn(arrive)}`;
      zhRows.push(`<tr><td>${idx + 1}</td><td>${escapeHtml(formatDateCN(d.date))}</td><td>${escapeHtml(routeCN)}</td><td>${scenicCN}</td><td>${hotelCN}</td><td>${transCN}${tip ? `（${escapeHtml(tip)}）` : ""}</td></tr>`);
      enRows.push(`<tr><td>${idx + 1}</td><td>${escapeHtml(formatDateEN(d.date))}</td><td>${escapeHtml(routeEN)}</td><td>${scenicEN}</td><td>${hotelEN}</td><td>${transEN}</td></tr>`);
    });
    setZhItinerary(`<div><strong>意大利申根签证行程单（中文版）</strong></div><div>申请人：${escapeHtml(applicantName || "未填写")} ｜ 护照号：${escapeHtml(passportNo || "未填写")} ｜ 出发地：${escapeHtml(`${province}${city}`)}</div><table><thead><tr><th>天数</th><th>日期（星期）</th><th>城市</th><th>景点</th><th>住宿</th><th>交通方式</th></tr></thead><tbody>${zhRows.join("")}</tbody></table>`);
    setEnItinerary(`<div><strong>ITALY SCHENGEN VISA ITINERARY (ENGLISH)</strong></div><div>Applicant: ${escapeHtml(applicantName || "N/A")} | Passport No.: ${escapeHtml(passportNo || "N/A")} | Departure: ${escapeHtml(cityToEn(city))}, China</div><table><thead><tr><th>Day</th><th>Date (Weekday)</th><th>City</th><th>Attractions</th><th>Accommodation</th><th>Transportation</th></tr></thead><tbody>${enRows.join("")}</tbody></table>`);
  };

  const generateLetter = () => {
    const travelPurposeEn = travelPurposeEnMap[travelPurpose] || travelPurpose;
    const guaranteesEn = guarantees.map(item => guaranteeOptionEnMap[item] || item);
    const zh = `<div><strong>签证解释信（中文版）</strong></div><p>尊敬的签证官：</p><p>您好！本人${escapeHtml(letterName || "申请人")}，本次前往意大利及申根区的主要目的为${escapeHtml(travelPurpose)}。</p><p>回国保证：${guarantees.length ? guarantees.map(escapeHtml).join("；") : "本人承诺按时回国，不逾期停留。"} </p><p>其他说明：${escapeHtml(otherExplain || "无")}</p><p>申请人：${escapeHtml(letterName || "申请人")}<br/>日期：${escapeHtml(new Date().toISOString().slice(0, 10))}</p>`;
    const en = `<div><strong>Visa Explanation Letter (English)</strong></div><p>Dear Visa Officer,</p><p>My name is ${escapeHtml(letterName || "Applicant")}. The purpose of this trip is ${escapeHtml(travelPurposeEn)}.</p><p>Return Commitment: ${guaranteesEn.length ? guaranteesEn.map(escapeHtml).join("; ") : "I undertake to return on time and comply with all applicable laws."}</p><p>Additional Explanation: ${escapeHtml(otherExplain || "None.")}</p><p>Applicant: ${escapeHtml(letterName || "Applicant")}<br/>Date: ${escapeHtml(new Date().toISOString().slice(0, 10))}</p>`;
    setZhLetter(zh);
    setEnLetter(en);
  };

  return (
    <main className="mx-auto w-[min(1260px,94vw)] py-8">
      <BlurFade>
        <MagicCard className={cn(panelShellClassName, "p-6")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full border-border bg-muted/50 px-3 py-1 text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                计划工作台
              </Badge>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">意大利申根签证材料助手</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  用于整理行程单、解释信与材料清单草稿，生成前请按实际预订单与个人材料逐项核对。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[
                ["itinerary", "行程单生成"],
                ["letter", "解释信生成"],
                ["checklist", "材料清单"]
              ].map(([k, label]) => (
                <Button
                  key={k}
                  type="button"
                  onClick={() => setTab(k as TabKey)}
                  variant={tab === k ? "default" : "outline"}
                  className={cn(
                    "rounded-full px-4 text-sm",
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
        <div className="mb-6 rounded-2xl border border-border bg-muted/70 px-4 py-3 text-sm font-semibold text-muted-foreground">
          免责声明：本工具仅作为签证申请材料辅助生成工具，不具备保证签证通过的效力，最终签证审核结果以领馆官方判定为准。
        </div>
      </BlurFade>

      {tab === "itinerary" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-0")}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="space-y-1">
                <Badge variant="outline" className="rounded-full border-border bg-muted/50 px-3 py-1 text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                  行程计划
                </Badge>
                <h2 className="text-2xl font-semibold text-foreground">签证行程单生成</h2>
                <p className="text-sm text-muted-foreground">按天维护路线、住宿与交通信息，并在右侧生成中英文预览。</p>
              </div>
              <ItineraryToolbar onAddDay={addDay} onGenerate={generateItinerary} />
            </div>
            <div className="space-y-5 px-6 py-6">
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

              <div className="space-y-4">
              {days.map((d, i) => {
                return (
                  <div key={i}>
                    <DayCard
                      index={i}
                      day={d}
                      countryOptions={countryOptions}
                      airportCandidates={getAirportCandidates(d)}
                      timeHint={getTimeHint(d)}
                      onDateChange={value => updateDay(i, { date: value })}
                      onApplyCascaderSelection={selection => applyCascaderSelection(i, selection)}
                      onRemoveCountryRow={countryIndex => removeCountryRow(i, countryIndex)}
                      onRemoveCity={(countryIndex, cityIndex) => removeCity(i, countryIndex, cityIndex)}
                      onRemoveScenic={(countryIndex, cityIndex, scenicIndex) => removeScenic(i, countryIndex, cityIndex, scenicIndex)}
                      onHotelChange={patch => updateDay(i, patch)}
                      onToggleTransport={(transport, checked) => toggleTransport(i, transport, checked)}
                      onFlightChange={patch => updateDay(i, patch)}
                    />
                  </div>
                );
              })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <GeneratedPreview title="中文版（可编辑）" html={zhItinerary} />
                <GeneratedPreview title="英文版（可编辑）" html={enItinerary} />
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "letter" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-6")}>
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold text-foreground">签证解释信生成</h2>
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
            <div className="mt-4">
              <Button onClick={generateLetter}>生成中英文解释信</Button>
            </div>
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">解释信结尾需手写签名，请打印后务必手写签名再提交至领馆。</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="min-h-40 rounded-xl border border-border bg-background p-3" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: zhLetter }} />
              <div className="min-h-40 rounded-xl border border-border bg-background p-3" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: enLetter }} />
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "checklist" && (
        <BlurFade delayMs={120}>
          <MagicCard className={cn(panelShellClassName, "p-6")}>
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold text-foreground">签证申请材料准备清单</h2>
              <p className="text-sm text-muted-foreground">按清单核对基础材料，勾选状态仅用于当前页面辅助记录。</p>
            </div>
            <div className="space-y-2">
              {materialList.map((m, i) => (
                <label key={m[0]} className="flex items-start gap-2 rounded-xl border border-border bg-background p-3">
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
