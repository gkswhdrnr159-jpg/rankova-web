export const games = [
  {
    slug: "valorant", name: "VALORANT", label: "발로란트", genre: "전술 슈팅",
    color: "valorant", mark: "V",
    intro: "교전 설계부터 요원 스킬 활용까지, 내 플레이에서 다음 라운드를 바꿀 포인트를 찾아보세요.",
    services: [
      { id: "vod", name: "라운드 리플레이 분석", description: "녹화된 경기에서 첫 교전, 포지셔닝, 라운드 운영을 검토합니다.", unit: "경기 1개 기준" },
      { id: "coaching", name: "요원별 1:1 코칭", description: "주력 요원의 스킬 사용과 팀 연계, 맵별 운영을 함께 점검합니다.", unit: "세션 1회 기준" },
    ],
  },
  {
    slug: "overwatch-2", name: "OVERWATCH 2", label: "오버워치 2", genre: "팀 기반 히어로 슈팅",
    color: "overwatch", mark: "Ω",
    intro: "주력 역할의 포지션과 교전 타이밍을 점검하고, 팀 전투에서 더 나은 선택을 연습하세요.",
    services: [
      { id: "vod", name: "팀 교전 리플레이 분석", description: "리플레이를 바탕으로 진입 타이밍, 궁극기 사용, 팀 합류 판단을 살펴봅니다.", unit: "경기 1개 기준" },
      { id: "coaching", name: "역할별 1:1 코칭", description: "돌격·공격·지원 중 주력 역할을 선택해 영웅 선택과 전투 운영을 점검합니다.", unit: "세션 1회 기준" },
    ],
  },
] as const;

