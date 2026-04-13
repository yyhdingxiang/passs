import { describe, expect, it } from "vitest";

import { getCityAirports, getEnglishAirportName, getEnglishCityName } from "./schengen-data";

describe("getCityAirports", () => {
  it("maps departure cities from trip basics that use 市 suffix", () => {
    expect(getCityAirports("成都市")).toEqual([
      "成都天府国际机场（TFU）",
      "成都双流国际机场（CTU）"
    ]);
    expect(getCityAirports("北京市")).toEqual([
      "北京首都国际机场（PEK）",
      "北京大兴国际机场（PKX）"
    ]);
  });
});

describe("english name helpers", () => {
  it("converts departure city names that include 市 suffix", () => {
    expect(getEnglishCityName("成都市")).toBe("Chengdu");
    expect(getEnglishCityName("北京市")).toBe("Beijing");
  });

  it("converts airport names to english style with IATA code", () => {
    expect(getEnglishAirportName("北京首都国际机场（PEK）")).toBe("Beijing Capital International Airport (PEK)");
    expect(getEnglishAirportName("上海虹桥国际机场（SHA）")).toBe("Shanghai Hongqiao International Airport (SHA)");
    expect(getEnglishAirportName("其他机场")).toBe("Other Airport");
  });
});
