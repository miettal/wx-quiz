export const CATEGORIES = {
  ippan: [
    "大気の構造",
    "大気の熱力学",
    "降水過程",
    "大気における放射",
    "大気の力学",
    "気象現象",
    "気候の変動",
    "気象業務法その他の気象業務に関する法規",
  ],
  senmon: [
    "観測の成果の利用",
    "数値予報",
    "短期予報・中期予報",
    "長期予報",
    "局地予報",
    "短時間予報",
    "気象災害",
    "予想の精度の評価",
    "気象の予想の応用",
  ],
} as const;

export type Subject = keyof typeof CATEGORIES;
