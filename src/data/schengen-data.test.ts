import { describe, expect, it } from "vitest";

import { getCityAirports } from "./schengen-data";

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
