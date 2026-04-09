import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

export type TripBasicsSectionProps = {
  applicantName: string;
  onApplicantNameChange: (v: string) => void;
  passportNo: string;
  onPassportNoChange: (v: string) => void;
  province: string;
  onProvinceChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  provinces: string[];
  cities: string[];
  tripStartDate: string;
  tripEndDate: string;
  onTripRangeChange: (range: { start: string; end: string }) => void;
  onAutoBuildDays: () => void;
};

function parseDate(value: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

function formatFieldDate(value: string) {
  const date = parseDate(value);
  return date ? format(date, "yyyy-MM-dd") : "未选择";
}

function formatRangeLabel(range: DateRange | undefined) {
  if (range?.from && range?.to) {
    return `${format(range.from, "yyyy-MM-dd")} - ${format(range.to, "yyyy-MM-dd")}`;
  }
  if (range?.from) {
    return `${format(range.from, "yyyy-MM-dd")} - 请选择结束日期`;
  }
  return "选择出发和返回日期";
}

export function TripBasicsSection(props: TripBasicsSectionProps) {
  const {
    applicantName,
    onApplicantNameChange,
    passportNo,
    onPassportNoChange,
    province,
    onProvinceChange,
    city,
    onCityChange,
    provinces,
    cities,
    tripStartDate,
    tripEndDate,
    onTripRangeChange,
    onAutoBuildDays
  } = props;
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const selectedRange = React.useMemo<DateRange | undefined>(() => {
    const from = parseDate(tripStartDate);
    const to = parseDate(tripEndDate);
    if (!from && !to) return undefined;
    return { from, to };
  }, [tripEndDate, tripStartDate]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    onTripRangeChange({
      start: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      end: range?.to ? format(range.to, "yyyy-MM-dd") : ""
    });
    if (range?.from && range?.to) {
      setDatePickerOpen(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">基础信息</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="applicantName">申请人姓名</Label>
          <Input id="applicantName" placeholder="申请人姓名" value={applicantName} onChange={e => onApplicantNameChange(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passportNo">护照号</Label>
          <Input id="passportNo" placeholder="护照号" value={passportNo} onChange={e => onPassportNoChange(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>出发省份</Label>
          <Select value={province} onValueChange={onProvinceChange}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="选择省份" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>出发城市</Label>
          <Select value={city} onValueChange={onCityChange}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="选择城市" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
          <Label>出行日期</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-between bg-card px-3 text-left text-sm font-normal shadow-xs",
                  !selectedRange && "text-muted-foreground"
                )}
              >
                <span>{formatRangeLabel(selectedRange)}</span>
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={selectedRange}
                defaultMonth={selectedRange?.from}
                onSelect={handleRangeSelect}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2">
          <div className="space-y-1.5">
            <Label>出发日期</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {formatFieldDate(tripStartDate)}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>返回日期</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {formatFieldDate(tripEndDate)}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <Button variant="outline" className="bg-card" onClick={onAutoBuildDays}>
            按日期范围自动生成天数
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
