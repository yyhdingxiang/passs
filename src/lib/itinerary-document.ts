export type ItineraryLocale = "zh" | "en";

export type ItineraryDocumentRow = {
  day: string;
  date: string;
  city: string;
  attractions: string;
  accommodation: string;
  transportation: string;
};

export type ItineraryDocument = {
  locale: ItineraryLocale;
  title: string;
  headerFields: Array<{ label: string; value: string }>;
  columns: Array<{ key: keyof ItineraryDocumentRow; label: string }>;
  rows: ItineraryDocumentRow[];
  fileName: string;
};

export type BuildItineraryDocumentInput = {
  applicantName: string;
  passportNo: string;
  departure: string;
  locale: ItineraryLocale;
  rows: ItineraryDocumentRow[];
};

function buildFileName(locale: ItineraryLocale) {
  const today = new Date().toISOString().slice(0, 10);
  return `schengen-itinerary-${locale}-${today}`;
}

export function buildItineraryDocument(input: BuildItineraryDocumentInput): ItineraryDocument {
  const isZh = input.locale === "zh";

  return {
    locale: input.locale,
    title: isZh ? "意大利申根签证行程单（中文版）" : "ITALY SCHENGEN VISA ITINERARY (ENGLISH)",
    headerFields: isZh
      ? [
          { label: "申请人", value: input.applicantName || "未填写" },
          { label: "护照号", value: input.passportNo || "未填写" },
          { label: "出发地", value: input.departure || "未填写" }
        ]
      : [
          { label: "Applicant", value: input.applicantName || "N/A" },
          { label: "Passport No.", value: input.passportNo || "N/A" },
          { label: "Departure", value: input.departure || "N/A" }
        ],
    columns: isZh
      ? [
          { key: "day", label: "天数" },
          { key: "date", label: "日期（星期）" },
          { key: "city", label: "城市" },
          { key: "attractions", label: "景点" },
          { key: "accommodation", label: "住宿" },
          { key: "transportation", label: "交通方式" }
        ]
      : [
          { key: "day", label: "Day" },
          { key: "date", label: "Date (Weekday)" },
          { key: "city", label: "City" },
          { key: "attractions", label: "Attractions" },
          { key: "accommodation", label: "Accommodation" },
          { key: "transportation", label: "Transportation" }
        ],
    rows: input.rows,
    fileName: buildFileName(input.locale)
  };
}
