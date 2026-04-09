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
import { buildCountryCityScenicOptions } from "@/lib/visa-form-options";
import { cn } from "@/lib/utils";
import { CalendarDays, Plane, Trash2, X } from "lucide-react";

export type DayCardProps = {
  index: number;
  day: DayItem;
  countryOptions: string[];
  airportCandidates: string[];
  timeHint: string;
  onDateChange: (value: string) => void;
  onApplyCascaderSelection: (selection: string[]) => void;
  onRemoveCountryRow: (countryIndex: number) => void;
  onRemoveCity: (countryIndex: number, cityIndex: number) => void;
  onRemoveScenic: (countryIndex: number, cityIndex: number, scenicIndex: number) => void;
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
    airportCandidates,
    timeHint,
    onDateChange,
    onApplyCascaderSelection,
    onRemoveCountryRow,
    onRemoveCity,
    onRemoveScenic,
    onHotelChange,
    onToggleTransport,
    onFlightChange
  } = props;
  const filledCountryRows = React.useMemo(
    () => day.countryRows
      .map((row, rowIndex) => ({ row, rowIndex }))
      .filter(item => item.row.country || item.row.cityRows.length),
    [day.countryRows]
  );
  const cascaderOptions = React.useMemo(() => buildCountryCityScenicOptions(countryOptions), [countryOptions]);
  const filledCountryCount = filledCountryRows.length;

  return (
    <Card className="border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b border-border bg-muted/40 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold tracking-[0.12em] text-muted-foreground">
              DAY {index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">第 {index + 1} 天行程安排</h3>
              <p className="text-sm text-muted-foreground">逐日维护国家、城市、景点、酒店与交通信息。</p>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-1.5">
            <Label htmlFor={`day-date-${index}`}>日期</Label>
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
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <section className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">路线快速录入</p>
            <p className="text-xs leading-5 text-muted-foreground">
              点击国家先展开城市，点击城市可直接录入；如需继续补录景点，请点右侧展开按钮进入下一级。
            </p>
          </div>
          <Cascader
            options={cascaderOptions}
            onChange={onApplyCascaderSelection}
            placeholder="选择国家 / 城市 / 景点"
            className="w-full bg-card"
            popupClassName="min-w-[320px]"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">停留国家与景点结构</h4>
              <p className="text-xs text-muted-foreground">上方级联负责主录入，这里只保留结果展示与删除整理。</p>
            </div>
            <div className="text-xs font-medium text-muted-foreground">共 {filledCountryCount} 个已填写国家段</div>
          </div>

          {filledCountryRows.length ? filledCountryRows.map(({ row: countryRow, rowIndex: countryIndex }, visibleIndex) => {
            return (
              <div
                key={`${countryIndex}-${countryRow.country || "empty"}`}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">国家段 {visibleIndex + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {countryRow.country ? `${countryRow.country} · ${countryRow.cityRows.length} 个城市` : "待选择国家"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructiveOutline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onRemoveCountryRow(countryIndex)}
                  >
                    <Trash2 className="size-3.5" />
                    删除国家段
                  </Button>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  继续补录国家、城市或景点时，请使用上方级联选择器，系统会自动归并到对应国家段。
                </div>

                <div className="mt-4 space-y-3">
                  {countryRow.cityRows.length ? countryRow.cityRows.map((cityRow, cityIndex) => (
                    <div key={`${cityIndex}-${cityRow.city}`} className="rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{cityRow.city}</div>
                          <div className="text-xs text-muted-foreground">已选 {cityRow.scenics.length} 个景点</div>
                        </div>
                        <Button
                          type="button"
                          variant="destructiveOutline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => onRemoveCity(countryIndex, cityIndex)}
                        >
                          删除城市
                        </Button>
                      </div>

                      {cityRow.scenics.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cityRow.scenics.map((scenic, scenicIndex) => (
                            <div
                              key={`${scenicIndex}-${scenic}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-xs text-foreground"
                            >
                              <span className="pl-1">{scenic}</span>
                              <Button
                                type="button"
                                variant="destructiveOutline"
                                size="icon"
                                className="size-5 rounded-full"
                                onClick={() => onRemoveScenic(countryIndex, cityIndex, scenicIndex)}
                                aria-label={`删除景点 ${scenic}`}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                          尚未添加景点，可先选择城市再添加景点。
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                      当前国家段尚未添加城市。
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
              暂未录入路线，请优先使用上方级联选择器添加国家、城市与景点。
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 space-y-1">
            <h4 className="text-sm font-semibold text-foreground">酒店信息</h4>
            <p className="text-xs text-muted-foreground">建议保持与预订单一致，联系方式尽量填写可核验内容。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`hotel-name-${index}`}>酒店名称</Label>
              <Input
                id={`hotel-name-${index}`}
                value={day.hotelName}
                placeholder="酒店名称"
                onChange={e => onHotelChange({ hotelName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`hotel-contact-${index}`}>酒店联系方式</Label>
              <Input
                id={`hotel-contact-${index}`}
                value={day.hotelContact}
                placeholder="酒店联系方式"
                onChange={e => onHotelChange({ hotelContact: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor={`hotel-address-${index}`}>酒店地址</Label>
            <Input
              id={`hotel-address-${index}`}
              value={day.hotelAddress}
              placeholder="酒店地址"
              onChange={e => onHotelChange({ hotelAddress: e.target.value })}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Plane className="size-4 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">交通方式</h4>
              <p className="text-xs text-muted-foreground">可多选，涉及飞机时补齐起降机场与航班号。</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {transportOptions.map(transport => {
              const checked = day.transports.includes(transport);

              return (
                <label
                  key={transport}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition",
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
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>起飞机场</Label>
                <Select
                  value={day.departureAirport || undefined}
                  onValueChange={value => onFlightChange({ departureAirport: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="选择起飞机场" />
                  </SelectTrigger>
                  <SelectContent>
                    {airportCandidates.map(airport => (
                      <SelectItem key={`dep-${airport}`} value={airport}>
                        {airport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>落地机场</Label>
                <Select
                  value={day.arrivalAirport || undefined}
                  onValueChange={value => onFlightChange({ arrivalAirport: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="选择落地机场" />
                  </SelectTrigger>
                  <SelectContent>
                    {airportCandidates.map(airport => (
                      <SelectItem key={`arr-${airport}`} value={airport}>
                        {airport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
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
            <div className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
              {timeHint ? `跨城通行时间参考：${timeHint}。` : ""}
              {day.transports.includes("飞机") ? " 已选择飞机，请同步核对起降机场、航班号与时差安排。" : ""}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
