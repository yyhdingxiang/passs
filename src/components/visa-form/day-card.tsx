"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Cascader } from "@/components/ui/cascader";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DayFlightPatch, DayHotelPatch, DayItem } from "@/components/visa-assistant";
import { scenicMap } from "@/data/schengen-data";
import { buildCountryCityScenicOptions } from "@/lib/visa-form-options";
import { cn } from "@/lib/utils";
import { CalendarDays, Plane, Trash2 } from "lucide-react";

export type DayCardProps = {
  index: number;
  day: DayItem;
  countryOptions: string[];
  departureAirportCandidates: string[];
  arrivalAirportCandidates: string[];
  timeHint: string;
  onDateChange: (value: string) => void;
  onAddCitySelection: () => number;
  onReplaceCitySelection: (countryIndex: number, cityIndex: number, selection: string[]) => void;
  onToggleScenicSelection: (countryIndex: number, cityIndex: number, scenicName: string, checked: boolean) => void;
  onRemoveCity: (countryIndex: number, cityIndex: number) => void;
  onHotelChange: (patch: DayHotelPatch) => void;
  onToggleTransport: (transport: string, checked: boolean) => void;
  onFlightChange: (patch: DayFlightPatch) => void;
};

const transportOptions = ["飞机", "火车", "汽车", "地铁", "步行", "公交", "轮渡", "出租车"];

export function DayCard(props: DayCardProps) {
  const {
    index,
    day,
    countryOptions,
    departureAirportCandidates,
    arrivalAirportCandidates,
    timeHint,
    onDateChange,
    onAddCitySelection,
    onReplaceCitySelection,
    onToggleScenicSelection,
    onRemoveCity,
    onHotelChange,
    onToggleTransport,
    onFlightChange
  } = props;
  const cascaderOptions = React.useMemo(() => buildCountryCityScenicOptions(countryOptions), [countryOptions]);
  const cityPickerRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const cityVisitRows = React.useMemo(
    () => {
      const entries = day.countryRows.flatMap((row, countryIndex) => row.cityRows.map((cityRow, cityIndex) => ({
        country: row.country,
        countryIndex,
        cityIndex,
        cityRow
      })));

      return entries.length ? entries : [{
        country: "",
        countryIndex: 0,
        cityIndex: 0,
        cityRow: {
          city: "",
          scenics: [],
          scenicDraft: ""
        }
      }];
    },
    [day.countryRows]
  );

  const openPickerByIndex = React.useCallback((rowIndex: number) => {
    cityPickerRefs.current[rowIndex]?.querySelector<HTMLElement>('[role="combobox"]')?.click();
  }, []);

  const handleAppendCityRow = React.useCallback(() => {
    const nextRowIndex = onAddCitySelection();

    // Wait for the reused or appended row to render, then open its city picker.
    queueMicrotask(() => {
      requestAnimationFrame(() => openPickerByIndex(nextRowIndex));
    });
  }, [onAddCitySelection, openPickerByIndex]);

  const getScenicChoicesByCity = React.useCallback((city: string) => {
    if (!city) return [];
    return scenicMap[city] || [];
  }, []);

  return (
    <Card className="border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b border-border bg-muted/40 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground sm:px-3 sm:text-xs">
            DAY {index + 1}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">第 {index + 1} 天行程安排</h3>
            <p className="text-xs text-muted-foreground sm:text-sm">逐日维护城市、景点、酒店与交通信息。</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 pt-4 sm:space-y-5 sm:px-6 sm:pb-6 sm:pt-5">
        <section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`day-date-${index}`} className="text-sm font-semibold text-foreground">日期</Label>
            <span className="text-xs font-medium text-destructive">必填</span>
          </div>
          <div className="mt-2.5 max-w-sm sm:mt-3">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`day-date-${index}`}
                type="date"
                className="pl-9"
                value={day.date}
                onChange={e => onDateChange(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground">游览城市与景点</Label>
              <span className="text-xs font-medium text-destructive">必填</span>
              <span className="text-xs text-muted-foreground">只需要维护当日游览城市，出发城市将取前一日游览城市自动补全在行程单中</span>
            </div>

            <div className="space-y-3">
              {cityVisitRows.map(({ country, countryIndex, cityIndex, cityRow }, rowIndex) => {
                const scenicChoices = getScenicChoicesByCity(cityRow.city);
                const hasCitySelection = Boolean(country && cityRow.city);
                const isPrimaryCityRow = rowIndex === 0;

                return (
                  <div key={`${countryIndex}-${cityIndex}-${cityRow.city}-${rowIndex}`} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto] xl:items-start">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            {isPrimaryCityRow ? "城市 1 " : `城市 ${rowIndex + 1} `}
                          </Label>
                          {isPrimaryCityRow && (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              用于跨日交通与机场参考
                            </span>
                          )}
                        </div>
                        <div
                          ref={node => {
                            cityPickerRefs.current[rowIndex] = node;
                          }}
                        >
                          <Cascader
                            options={cascaderOptions}
                            value={country && cityRow.city ? [country, cityRow.city] : undefined}
                            onChange={selection => onReplaceCitySelection(countryIndex, cityIndex, selection)}
                            placeholder="选择国家 / 城市"
                            className="w-full bg-background"
                            popupClassName="min-w-[320px]"
                            allowClear={false}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-xs font-medium text-muted-foreground">景点选择（距离为距市中心距离，距离与价格仅作参考）</Label>
                          <span className="text-xs text-muted-foreground">
                            {hasCitySelection ? "非必填，勾选即生效，可随时取消" : "请先选择该行城市"}
                          </span>
                        </div>
                        <div className="space-y-2 rounded-lg border border-border bg-background/80 p-2.5 sm:space-y-3 sm:p-3">
                          {cityRow.scenics.length ? (
                            <div className="flex flex-wrap gap-2">
                              {cityRow.scenics.map(scenic => (
                                <span
                                  key={`${country}-${cityRow.city}-${scenic}`}
                                  className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                                >
                                  {scenic}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              暂未选择景点，若当天以赶路或休整为主，可留空。
                              先确定该行城市，再勾选对应景点，避免误点后关闭但未生效。
                            </div>
                          )}

                          
                          {hasCitySelection && !scenicChoices.length && (
                            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                              当前城市暂无预置景点，可只保留城市或补充自定义文案到最终预览中。
                            </div>
                          )}

                          {hasCitySelection && scenicChoices.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {scenicChoices.map(([scenicName, scenicNameEn, distance, price]) => {
                                const checked = cityRow.scenics.includes(scenicName);

                                return (
                                  <label
                                    key={`${country}-${cityRow.city}-${scenicName}`}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition",
                                      checked
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border bg-background hover:border-foreground/20"
                                    )}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={value => onToggleScenicSelection(countryIndex, cityIndex, scenicName, value === true)}
                                    />
                                    <div className="min-w-0 space-y-1">
                                      <div className="text-sm font-medium text-foreground">{scenicName}</div>
                                      <div className="text-xs leading-5 text-muted-foreground">
                                        {scenicNameEn}
                                        {(distance || price) ? ` · ${[distance, price].filter(Boolean).join(" · ")}` : ""}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end xl:pt-5">
                        <Button
                          type="button"
                          variant="destructiveOutline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onRemoveCity(countryIndex, cityIndex)}
                        >
                          <Trash2 className="size-3.5" />
                          删除城市
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end">
              <Button type="button" variant="outline" size="sm" className="bg-card" onClick={handleAppendCityRow}>
                + 新增游览城市
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
          <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
            <h4 className="text-sm font-semibold text-foreground">住宿信息</h4>
            <span className="text-xs font-medium text-destructive">必填</span>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`hotel-name-${index}`}>酒店名称</Label>
              <Input
                id={`hotel-name-${index}`}
                value={day.hotelName}
                placeholder="酒店名称"
                onChange={e => onHotelChange({ hotelName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`hotel-contact-${index}`}>酒店联系方式</Label>
              <Input
                id={`hotel-contact-${index}`}
                value={day.hotelContact}
                placeholder="酒店联系方式"
                onChange={e => onHotelChange({ hotelContact: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`hotel-address-${index}`}>酒店地址</Label>
              <Input
                id={`hotel-address-${index}`}
                value={day.hotelAddress}
                placeholder="酒店地址"
                onChange={e => onHotelChange({ hotelAddress: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
          <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
            <Plane className="size-4 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">交通方式</h4>
              <p className="text-xs text-muted-foreground">必填，可多选；涉及飞机时需您选择起降机场并填写航班号。</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {transportOptions.map(transport => {
              const checked = day.transports.includes(transport);

              return (
                <label
                  key={transport}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition",
                    checked
                      ? "border-primary/40 bg-background text-foreground"
                      : "border-border bg-background/80 text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={value => onToggleTransport(transport, value === true)}
                  />
                  <span className="text-sm font-medium">{transport}</span>
                </label>
              );
            })}
          </div>

          {day.transports.includes("飞机") && (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>起飞机场</Label>
                <Select
                  value={day.departureAirport || undefined}
                  onValueChange={value => onFlightChange({ departureAirport: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="选择起飞机场" />
                  </SelectTrigger>
                  <SelectContent>
                    {departureAirportCandidates.map(airport => (
                      <SelectItem key={`dep-${airport}`} value={airport}>
                        {airport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>落地机场</Label>
                <Select
                  value={day.arrivalAirport || undefined}
                  onValueChange={value => onFlightChange({ arrivalAirport: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="选择落地机场" />
                  </SelectTrigger>
                  <SelectContent>
                    {arrivalAirportCandidates.map(airport => (
                      <SelectItem key={`arr-${airport}`} value={airport}>
                        {airport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`flight-no-${index}`}>航班号</Label>
                <Input
                  id={`flight-no-${index}`}
                  value={day.flightNo}
                  placeholder="填写航班号"
                  onChange={e => onFlightChange({ flightNo: e.target.value })}
                />
              </div>
            </div>
          )}

          {(timeHint || day.transports.includes("飞机")) && (
            <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
              {timeHint ? `跨城通行时间参考：${timeHint}。` : ""}
              {day.transports.includes("飞机") ? " 已选择飞机，请同步核对起降机场、航班号与时差安排。" : ""}
            </div>
          )}
        </section>

      </CardContent>
    </Card>
  );
}
