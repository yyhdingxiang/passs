"use client";

import { useMemo, useState } from "react";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { GeneratedPreview } from "@/components/visa-form/generated-preview";
import { ItineraryToolbar } from "@/components/visa-form/itinerary-toolbar";
import { TripBasicsSection } from "@/components/visa-form/trip-basics-section";
import {
  cityAirportMap,
  countryCityMap,
  crossCityTime,
  scenicMap,
  schengenCountries,
  zhEnCity
} from "@/data/schengen-data";

type TabKey = "itinerary" | "letter" | "checklist";
type CityRow = {
  city: string;
  scenics: string[];
  scenicDraft: string;
};
type CountryRow = {
  country: string;
  cityRows: CityRow[];
  cityDraft: string;
  scenicCityDraft: string;
  scenicDraft: string;
};
type DayItem = {
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

const weekCN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const weekEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const transportOptions = ["飞机", "火车", "汽车", "地铁", "步行", "公交", "轮渡", "出租车"];
const guaranteeOptions = [
  "本人承诺按时回国，不逾期停留，严格遵守意大利及申根区相关法律法规。",
  "本人在中国有稳定工作与社会关系，具备充分回国约束。",
  "本人本次出行费用来源合法，已做好完整行程与预算安排。",
  "本人将按提交行程访问，不从事与签证目的不符活动。",
  "本人在中国有固定住所与长期居住安排，将按时返回居住地。",
  "本人居住证不满一年，已附上有效在华居住及工作/学习证明。",
  "本人本次出国目的明确，仅用于旅游/商务/探亲，不涉及滞留意图。"
];
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
const cnGeo: Record<string, Record<string, string[]>> = {
  四川省: { 成都市: ["锦江区", "青羊区", "武侯区"], 绵阳市: ["涪城区", "游仙区"], 乐山市: ["市中区", "沙湾区"] },
  广东省: { 广州市: ["天河区", "越秀区", "海珠区"], 深圳市: ["南山区", "福田区", "罗湖区"], 珠海市: ["香洲区", "斗门区"] },
  浙江省: { 杭州市: ["西湖区", "上城区", "滨江区"], 宁波市: ["海曙区", "江北区"], 温州市: ["鹿城区", "龙湾区"] },
  北京市: { 北京市: ["朝阳区", "海淀区", "东城区"] },
  上海市: { 上海市: ["浦东新区", "徐汇区", "静安区"] }
};

function emptyDay(): DayItem {
  return {
    date: "",
    countryRows: [{ country: "", cityRows: [], cityDraft: "", scenicCityDraft: "", scenicDraft: "" }],
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

function getFallbackScenicOptions() {
  return Array.from({ length: 15 }).map((_, idx) => [`地标景点${idx + 1}`, `Landmark ${idx + 1}`, `${1 + idx * 0.4}公里`, `约${10 + idx}欧元/人`] as [string, string, string, string]);
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

  const updateDay = (index: number, patch: Partial<DayItem>) => {
    setDays(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
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

  const generateItinerary = () => {
    const zhRows: string[] = [];
    const enRows: string[] = [];
    days.forEach((d, idx) => {
      const cityRoutePoints = d.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)).filter(Boolean);
      const countryRoutePoints = d.countryRows.map(row => row.country).filter(Boolean);
      const routePoints = cityRoutePoints.length ? cityRoutePoints : countryRoutePoints;
      const depart = routePoints[0] || "-";
      const arrive = routePoints[routePoints.length - 1] || depart;
      const via = routePoints.slice(1, -1);
      const scenicRows = d.countryRows.flatMap(row => row.cityRows.filter(cityRow => cityRow.scenics.length).map(cityRow => ({ city: cityRow.city, scenics: cityRow.scenics })));
      const scenicCN = scenicRows.map(row => `${row.city}：${row.scenics.join("、")}`).join("；") || "-";
      const scenicEN = scenicRows.map(row => {
        const scenicNames = row.scenics.map(scenic => {
          const hit = Object.values(scenicMap).flat().find(v => v[0] === scenic);
          return hit?.[1] || scenic;
        });
        return `${cityToEn(row.city)}: ${scenicNames.join(", ")}`;
      }).join("; ") || "-";
      const hotelCN = `酒店：${d.hotelName || "-"}；地址：${d.hotelAddress || "-"}；联系方式：${d.hotelContact || "-"}`;
      const hotelEN = `Hotel: ${d.hotelName || "-"}; Address: ${d.hotelAddress || "-"}; Contact: ${d.hotelContact || "-"}`;
      const translatedTransports = d.transports.map(t => ({ 飞机: "Flight", 火车: "Train", 汽车: "Car", 地铁: "Metro", 步行: "Walking", 公交: "Bus", 轮渡: "Ferry", 出租车: "Taxi" }[t] || t));
      const transCNBase = d.transports.join(" + ");
      const transENBase = translatedTransports.join(" + ");
      const flightCN = d.transports.includes("飞机")
        ? `（起飞：${d.departureAirport || "-"}；落地：${d.arrivalAirport || "-"}；航班号：${d.flightNo || "-"}）`
        : "";
      const flightEN = d.transports.includes("飞机")
        ? ` (Dep: ${d.departureAirport || "-"}; Arr: ${d.arrivalAirport || "-"}; Flight No.: ${d.flightNo || "-"})`
        : "";
      const transCN = (transCNBase ? `${transCNBase}${flightCN}` : "-");
      const transEN = (transENBase ? `${transENBase}${flightEN}` : "-");
      const key = `${depart}-${arrive}`;
      const rev = `${arrive}-${depart}`;
      const tip = crossCityTime[key] || crossCityTime[rev];
      const routeCN = via.length ? `${depart} → ${via.join(" → ")} → ${arrive}` : depart === arrive ? depart : `${depart} → ${arrive}`;
      const routeEN = via.length ? `${cityToEn(depart)} → ${via.map(cityToEn).join(" → ")} → ${cityToEn(arrive)}` : depart === arrive ? cityToEn(depart) : `${cityToEn(depart)} to ${cityToEn(arrive)}`;
      zhRows.push(`<tr><td>${idx + 1}</td><td>${formatDateCN(d.date)}</td><td>${routeCN}</td><td>${scenicCN}</td><td>${hotelCN}</td><td>${transCN}${tip ? `（${tip}）` : ""}</td></tr>`);
      enRows.push(`<tr><td>${idx + 1}</td><td>${formatDateEN(d.date)}</td><td>${routeEN}</td><td>${scenicEN}</td><td>${hotelEN}</td><td>${transEN}</td></tr>`);
    });
    setZhItinerary(`<div><strong>意大利申根签证行程单（中文版）</strong></div><div>申请人：${applicantName || "未填写"} ｜ 护照号：${passportNo || "未填写"} ｜ 出发地：${province}${city}</div><table><thead><tr><th>天数</th><th>日期（星期）</th><th>城市</th><th>景点</th><th>住宿</th><th>交通方式</th></tr></thead><tbody>${zhRows.join("")}</tbody></table>`);
    setEnItinerary(`<div><strong>ITALY SCHENGEN VISA ITINERARY (ENGLISH)</strong></div><div>Applicant: ${applicantName || "N/A"} | Passport No.: ${passportNo || "N/A"} | Departure: ${cityToEn(city)}, China</div><table><thead><tr><th>Day</th><th>Date (Weekday)</th><th>City</th><th>Attractions</th><th>Accommodation</th><th>Transportation</th></tr></thead><tbody>${enRows.join("")}</tbody></table>`);
  };

  const generateLetter = () => {
    const zh = `<div><strong>签证解释信（中文版）</strong></div><p>尊敬的签证官：</p><p>您好！本人${letterName || "申请人"}，本次前往意大利及申根区的主要目的为${travelPurpose}。</p><p>回国保证：${guarantees.join("；") || "本人承诺按时回国，不逾期停留。"} </p><p>其他说明：${otherExplain || "无"}</p><p>申请人：${letterName || "申请人"}<br/>日期：${new Date().toISOString().slice(0, 10)}</p>`;
    const en = `<div><strong>Visa Explanation Letter (English)</strong></div><p>Dear Visa Officer,</p><p>My name is ${letterName || "Applicant"}. The purpose of this trip is ${travelPurpose}.</p><p>Return Commitment: ${guarantees.length ? guarantees.join("; ") : "I undertake to return on time and comply with all applicable laws."}</p><p>Additional Explanation: ${otherExplain || "None."}</p><p>Applicant: ${letterName || "Applicant"}<br/>Date: ${new Date().toISOString().slice(0, 10)}</p>`;
    setZhLetter(zh);
    setEnLetter(en);
  };

  return (
    <main className="mx-auto w-[min(1240px,94vw)] py-6">
      <BlurFade>
        <MagicCard className="relative mb-5 overflow-hidden p-6">
          <AnimatedGridPattern />
          <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">
            Schengen Visa Material Studio
          </div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">意大利申根签证材料AI生成助手</h1>
          <p className="mb-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">使用 Next.js + Magic UI 组件重构交互布局，支持行程单、解释信、材料清单的高效生成与编辑。</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["itinerary", "行程单生成"],
              ["letter", "解释信生成"],
              ["checklist", "材料清单"]
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k as TabKey)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${tab === k ? "border-blue-300 bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </MagicCard>
      </BlurFade>

      <BlurFade delayMs={80}>
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          免责声明：本工具仅作为签证申请材料辅助生成工具，不具备保证签证通过的效力，最终签证审核结果以领馆官方判定为准。
        </div>
      </BlurFade>

      {tab === "itinerary" && (
        <BlurFade delayMs={120}>
          <MagicCard className="mb-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">签证行程单生成</h2>
              <ItineraryToolbar onAddDay={addDay} onGenerate={generateItinerary} />
            </div>
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

            <div className="mt-4 space-y-3">
              {days.map((d, i) => {
                const countryOptions = ["中国", ...schengenCountries];
                const cityPreviewPoints = d.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)).filter(Boolean);
                const countryPreviewPoints = d.countryRows.map(row => row.country).filter(Boolean);
                const previewPoints = cityPreviewPoints.length ? cityPreviewPoints : countryPreviewPoints;
                const previewFrom = previewPoints[0] || "";
                const previewTo = previewPoints[previewPoints.length - 1] || "";
                const previewVia = previewPoints.slice(1, -1);
                const timeHint = previewFrom && previewTo ? (crossCityTime[`${previewFrom}-${previewTo}`] || crossCityTime[`${previewTo}-${previewFrom}`]) : "";
                const selectedCities = new Set(d.countryRows.flatMap(row => row.cityRows.map(cityRow => cityRow.city)));
                const selectedScenics = new Set(d.countryRows.flatMap(row => row.cityRows.flatMap(cityRow => cityRow.scenics)));
                const airportOptions = Array.from(new Set(cityPreviewPoints.flatMap(cityName => cityAirportMap[cityName] || [])));
                const airportCandidates = airportOptions.length ? airportOptions : ["其他机场"];
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800">第 {i + 1} 天</div>
                      <input type="date" className="rounded-lg border border-slate-200 px-2 py-2" value={d.date} onChange={e => updateDay(i, { date: e.target.value })} />
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="space-y-2">
                        {d.countryRows.map((countryRow, countryIndex) => {
                          const cityOptions = countryCityMap[countryRow.country] || [];
                          const scenicCityOptions = countryRow.cityRows.map(cityRow => cityRow.city);
                          const scenicOptions = scenicMap[countryRow.scenicCityDraft] || getFallbackScenicOptions();
                          return (
                            <div key={`${countryIndex}-${countryRow.country}`} className="rounded-lg border border-slate-200 bg-white p-2">
                              <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.2fr)]">
                                <div className="flex items-center gap-2">
                                  <select
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                                    value={countryRow.country}
                                    onChange={e => {
                                      const selectedCountry = e.target.value;
                                      const nextCountryRows = d.countryRows.map((item, idx) => idx === countryIndex ? { country: selectedCountry, cityRows: [], cityDraft: "", scenicCityDraft: "", scenicDraft: "" } : item);
                                      if (selectedCountry && countryIndex === nextCountryRows.length - 1) {
                                        nextCountryRows.push({ country: "", cityRows: [], cityDraft: "", scenicCityDraft: "", scenicDraft: "" });
                                      }
                                      updateDay(i, { countryRows: nextCountryRows });
                                    }}
                                  >
                                    <option value="">选择国家</option>
                                    {countryOptions.map(country => <option key={country} value={country}>{country}</option>)}
                                  </select>
                                  <button
                                    type="button"
                                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => {
                                      const filledCount = d.countryRows.filter(row => row.country || row.cityRows.length).length;
                                      if (filledCount <= 1 && countryRow.country) return;
                                      const nextCountryRows = d.countryRows.filter((_, idx) => idx !== countryIndex);
                                      updateDay(i, { countryRows: nextCountryRows.length ? nextCountryRows : [{ country: "", cityRows: [], cityDraft: "", scenicCityDraft: "", scenicDraft: "" }] });
                                    }}
                                    disabled={d.countryRows.filter(row => row.country || row.cityRows.length).length <= 1 && !!countryRow.country}
                                  >
                                    删除
                                  </button>
                                </div>
                                <select
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                                  value={countryRow.cityDraft}
                                  onChange={e => {
                                    const selectedCity = e.target.value;
                                    if (!selectedCity || selectedCities.has(selectedCity)) return;
                                    const nextCountryRows = d.countryRows.map((item, idx) => {
                                      if (idx !== countryIndex) return item;
                                      return {
                                        ...item,
                                        cityRows: [...item.cityRows, { city: selectedCity, scenics: [], scenicDraft: "" }],
                                        cityDraft: ""
                                      };
                                    });
                                    updateDay(i, { countryRows: nextCountryRows });
                                  }}
                                  disabled={!countryRow.country}
                                >
                                  <option value="">选择城市（多选，自动逐行回显）</option>
                                  {cityOptions.map(cityName => <option key={cityName} value={cityName} disabled={selectedCities.has(cityName)}>{cityName}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                                    value={countryRow.scenicCityDraft}
                                    onChange={e => {
                                      const selectedCity = e.target.value;
                                      const nextCountryRows = d.countryRows.map((item, idx) => idx === countryIndex ? { ...item, scenicCityDraft: selectedCity, scenicDraft: "" } : item);
                                      updateDay(i, { countryRows: nextCountryRows });
                                    }}
                                    disabled={!countryRow.cityRows.length}
                                  >
                                    <option value="">级联第一步：选择城市</option>
                                    {scenicCityOptions.map(cityName => <option key={cityName} value={cityName}>{cityName}</option>)}
                                  </select>
                                  <select
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                                    value={countryRow.scenicDraft}
                                    onChange={e => {
                                      const selectedScenic = e.target.value;
                                      if (!selectedScenic || !countryRow.scenicCityDraft || selectedScenics.has(selectedScenic)) return;
                                      const nextCountryRows = d.countryRows.map((item, idx) => {
                                        if (idx !== countryIndex) return item;
                                        return {
                                          ...item,
                                          cityRows: item.cityRows.map(cityItem => cityItem.city === item.scenicCityDraft ? { ...cityItem, scenics: [...cityItem.scenics, selectedScenic] } : cityItem),
                                          scenicDraft: ""
                                        };
                                      });
                                      updateDay(i, { countryRows: nextCountryRows });
                                    }}
                                    disabled={!countryRow.scenicCityDraft}
                                  >
                                    <option value="">级联第二步：选择景点</option>
                                    {scenicOptions.map(option => <option key={option[0]} value={option[0]} disabled={selectedScenics.has(option[0])}>{option[0]}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2 space-y-2">
                                {countryRow.cityRows.map((cityRow, cityIndex) => (
                                  <div key={`${cityIndex}-${cityRow.city}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-xs font-medium text-slate-700">{cityRow.city}</div>
                                      <button
                                        type="button"
                                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600"
                                        onClick={() => {
                                          const nextCountryRows = d.countryRows.map((item, idx) => {
                                            if (idx !== countryIndex) return item;
                                            const nextCityRows = item.cityRows.filter((_, cityIdx) => cityIdx !== cityIndex);
                                            const resetScenicCityDraft = item.scenicCityDraft === cityRow.city ? "" : item.scenicCityDraft;
                                            return { ...item, cityRows: nextCityRows, scenicCityDraft: resetScenicCityDraft, scenicDraft: resetScenicCityDraft ? item.scenicDraft : "" };
                                          });
                                          updateDay(i, { countryRows: nextCountryRows });
                                        }}
                                      >
                                        删除城市
                                      </button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {cityRow.scenics.map((scenic, scenicIndex) => (
                                        <span key={`${scenicIndex}-${scenic}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
                                          <span>{scenic}</span>
                                          <button
                                            type="button"
                                            className="text-slate-500"
                                            onClick={() => {
                                              const nextCountryRows = d.countryRows.map((item, idx) => {
                                                if (idx !== countryIndex) return item;
                                                return {
                                                  ...item,
                                                  cityRows: item.cityRows.map((cityItem, cityIdx) => cityIdx === cityIndex ? { ...cityItem, scenics: cityItem.scenics.filter((_, sIdx) => sIdx !== scenicIndex) } : cityItem)
                                                };
                                              });
                                              updateDay(i, { countryRows: nextCountryRows });
                                            }}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {previewPoints.length > 1 && (
                        <div className="mt-2 text-xs text-slate-600">
                          出发地：{previewFrom} ｜ 途经地：{previewVia.length ? previewVia.join("、") : "无"} ｜ 目的地：{previewTo}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input className="rounded-lg border border-slate-200 px-2 py-2" placeholder="酒店名称" value={d.hotelName} onChange={e => updateDay(i, { hotelName: e.target.value })} />
                      <input className="rounded-lg border border-slate-200 px-2 py-2" placeholder="酒店联系方式" value={d.hotelContact} onChange={e => updateDay(i, { hotelContact: e.target.value })} />
                    </div>
                    <input className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-2" placeholder="酒店地址" value={d.hotelAddress} onChange={e => updateDay(i, { hotelAddress: e.target.value })} />
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">{transportOptions.map(t => <label key={t} className="mr-2 inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={d.transports.includes(t)} onChange={e => updateDay(i, { transports: e.target.checked ? [...d.transports, t] : d.transports.filter(x => x !== t) })} />{t}</label>)}</div>
                    {d.transports.includes("飞机") && (
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        <select className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm" value={d.departureAirport} onChange={e => updateDay(i, { departureAirport: e.target.value })}>
                          <option value="">选择起飞机场</option>
                          {airportCandidates.map(airport => <option key={`dep-${airport}`} value={airport}>{airport}</option>)}
                        </select>
                        <select className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm" value={d.arrivalAirport} onChange={e => updateDay(i, { arrivalAirport: e.target.value })}>
                          <option value="">选择落地机场</option>
                          {airportCandidates.map(airport => <option key={`arr-${airport}`} value={airport}>{airport}</option>)}
                        </select>
                        <input className="rounded-lg border border-slate-200 px-2 py-2" placeholder="填写航班号" value={d.flightNo} onChange={e => updateDay(i, { flightNo: e.target.value })} />
                      </div>
                    )}
                    {(timeHint || d.transports.includes("飞机")) && (
                      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        {timeHint ? `跨城通行时间：${timeHint}（仅供参考）` : ""} {d.transports.includes("飞机") ? "已选择飞机，请补充起降机场与航班号，并注意中意时差约6-7小时。" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <GeneratedPreview title="中文版（可编辑）" html={zhItinerary} />
              <GeneratedPreview title="英文版（可编辑）" html={enItinerary} />
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "letter" && (
        <BlurFade delayMs={120}>
          <MagicCard className="mb-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">签证解释信生成</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" placeholder="姓名" value={letterName} onChange={e => setLetterName(e.target.value)} />
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5" value={travelPurpose} onChange={e => setTravelPurpose(e.target.value)}>
                {["旅游", "商务", "探亲", "访友", "文化交流"].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">{guaranteeOptions.map(g => (
              <label key={g} className="mb-1 block text-sm text-slate-700">
                <input type="checkbox" checked={guarantees.includes(g)} onChange={e => setGuarantees(prev => (e.target.checked ? [...prev, g] : prev.filter(v => v !== g)))} /> {g}
              </label>
            ))}</div>
            <textarea className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" placeholder="其他需解释内容" value={otherExplain} onChange={e => setOtherExplain(e.target.value)} />
            <div className="mt-3"><ShimmerButton onClick={generateLetter}>生成中英文解释信</ShimmerButton></div>
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">解释信结尾需手写签名，请打印后务必手写签名再提交至领馆。</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="min-h-40 rounded-xl border border-slate-200 bg-white p-3" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: zhLetter }} />
              <div className="min-h-40 rounded-xl border border-slate-200 bg-white p-3" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: enLetter }} />
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {tab === "checklist" && (
        <BlurFade delayMs={120}>
          <MagicCard className="mb-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">签证申请材料准备清单</h2>
            <div className="space-y-2">
              {materialList.map((m, i) => (
                <label key={m[0]} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
                  <input type="checkbox" checked={!!checkMap[i]} onChange={e => setCheckMap(prev => ({ ...prev, [i]: e.target.checked }))} />
                  <span>
                    <strong>{m[0]}</strong> <span className={`rounded-full border px-2 py-0.5 text-xs ${m[1] === "必备" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-violet-300 bg-violet-50 text-violet-700"}`}>{m[1]}</span>
                    <div className="text-xs text-slate-500">{m[2]}</div>
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
