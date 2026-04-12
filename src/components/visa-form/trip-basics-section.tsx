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

function formatRangeLabel(range: DateRange | undefined, awaitingReturnDate: boolean) {
  if (range?.from && range?.to && !awaitingReturnDate) {
    return `${format(range.from, "yyyy-MM-dd")} - ${format(range.to, "yyyy-MM-dd")}`;
  }
  if (range?.from) {
    return `${format(range.from, "yyyy-MM-dd")} - 请选择返回日期`;
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
  const [pendingStartDate, setPendingStartDate] = React.useState<Date | undefined>(undefined);

  const committedStartDate = React.useMemo(() => parseDate(tripStartDate), [tripStartDate]);
  const committedEndDate = React.useMemo(() => parseDate(tripEndDate), [tripEndDate]);

  const selectedRange = React.useMemo<DateRange | undefined>(() => {
    const from = pendingStartDate ?? committedStartDate;
    const to = committedEndDate;
    if (!from && !to) return undefined;
    if (!from) return undefined;
    return { from, to: to ?? from };
  }, [committedEndDate, committedStartDate, pendingStartDate]);

  const awaitingReturnDate = Boolean(selectedRange?.from && (!committedEndDate || pendingStartDate));

  const rangeMiddleMatcher = React.useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return undefined;
    if (selectedRange.from.getTime() === selectedRange.to.getTime()) return undefined;
    return (date: Date) => date > selectedRange.from! && date < selectedRange.to!;
  }, [selectedRange]);

  const updateTripRange = React.useCallback((start: Date, end: Date) => {
    const [from, to] = start.getTime() <= end.getTime() ? [start, end] : [end, start];
    onTripRangeChange({
      start: format(from, "yyyy-MM-dd"),
      end: format(to, "yyyy-MM-dd")
    });
  }, [onTripRangeChange]);

  const handleDaySelect = React.useCallback((date: Date | undefined) => {
    if (!date) return;

    if (!pendingStartDate) {
      setPendingStartDate(date);
      onTripRangeChange({
        start: format(date, "yyyy-MM-dd"),
        end: ""
      });
      return;
    }

    updateTripRange(pendingStartDate, date);
    setPendingStartDate(undefined);
    setDatePickerOpen(false);
  }, [onTripRangeChange, pendingStartDate, updateTripRange]);

  const handleDatePickerOpenChange = React.useCallback((open: boolean) => {
    setDatePickerOpen(open);
    if (!open) {
      setPendingStartDate(undefined);
      return;
    }
    if (committedStartDate && !committedEndDate) {
      setPendingStartDate(committedStartDate);
      return;
    }
    setPendingStartDate(undefined);
  }, [committedEndDate, committedStartDate]);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <CardTitle className="text-base font-semibold text-foreground sm:text-lg">基础信息</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 pb-4 pt-4 sm:gap-5 sm:px-6 sm:pb-6 sm:pt-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="applicantName">申请人姓名</Label>
          <Input id="applicantName" placeholder="申请人姓名" value={applicantName} onChange={e => onApplicantNameChange(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="passportNo">护照号</Label>
          <Input id="passportNo" placeholder="护照号" value={passportNo} onChange={e => onPassportNoChange(e.target.value)} />
        </div>

        <div className="space-y-1">
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

        <div className="space-y-1">
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

        <div className="space-y-1 md:col-span-2 xl:col-span-2">
          <Label>出行日期</Label>
          <Popover open={datePickerOpen} onOpenChange={handleDatePickerOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-between bg-card px-3 text-left text-sm font-normal shadow-xs",
                  !selectedRange && "text-muted-foreground"
                )}
              >
                <span>{formatRangeLabel(selectedRange, awaitingReturnDate)}</span>
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                numberOfMonths={2}
                selected={selectedRange?.from}
                defaultMonth={pendingStartDate ?? selectedRange?.from}
                onSelect={handleDaySelect}
                modifiers={{
                  range_start: selectedRange?.from ? [selectedRange.from] : [],
                  range_end: selectedRange?.to ? [selectedRange.to] : [],
                  range_middle: rangeMiddleMatcher ? [rangeMiddleMatcher] : []
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:col-span-2">
          <div className="space-y-1">
            <Label>出发日期</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {formatFieldDate(tripStartDate)}
            </div>
          </div>
          <div className="space-y-1">
            <Label>返回日期</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {formatFieldDate(tripEndDate)}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <Button type="button" className="h-9 px-3 text-sm" onClick={onAutoBuildDays}>
            生成行程安排表
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
