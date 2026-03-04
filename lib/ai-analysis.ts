export interface VoteRecord {
  questionId: string;
  voterId: string;
  votedForId: string;
}

export interface PlayerInfo {
  id: string;
  nickname: string;
}

export interface SelectionStats {
  /** Kaç soruda bu oyuncu seçildi */
  timesChosen: number;
  /** Toplam soru sayısı */
  totalQuestions: number;
}

/** Soru bazında: o soruda her oyuncunun seçilme yüzdesi */
export interface QuestionLevelStat {
  questionId: string;
  questionText: string;
  voterCount: number;
  /** Oyuncu id → o soruda seçilme yüzdesi (0–100) */
  selectionPercentByPlayer: Record<string, number>;
}

export interface AnalyzeInput {
  voteMatrix: VoteRecord[];
  players: PlayerInfo[];
  modeName: string;
  /** Oyuncu bazında: kaç soruda seçildi (soru bazlı) */
  selectionByPlayer: Record<string, number>;
  totalQuestions: number;
  /** Soru bazında yüzde verisi; varsa soru bazlı detaylı inceleme üretilir */
  questionStats?: QuestionLevelStat[];
}

/** Tek bir soru için oyuncunun seçilme oranına göre kısa AI yorumu */
export interface QuestionInsight {
  questionText: string;
  percent: number;
  insight: string;
}

export interface PlayerAnalysis {
  playerId: string;
  nickname: string;
  /** 3-4 cümlelik yapay zeka yorumu (oy sayısı içermez) */
  comment: string;
  title: string;
  /** Sorulara göre seçilme: kaç soruda seçildi / toplam soru */
  selectionStats: SelectionStats;
  /** Soru bazında soru metni, yüzde ve kısa inceleme (questionStats verilirse dolar) */
  questionInsights?: QuestionInsight[];
}

export interface AnalyzeResult {
  playerAnalyses: PlayerAnalysis[];
  /** Kısa grup özeti (oy sayısı vb. gereksiz bilgi yok) */
  groupSummary: string;
}

const TITLES_BY_RANK = [
  "Ana Karakter",
  "Gizli Stratejist",
  "Kaos Ajanı",
  "Barış Koruyucu",
  "Vahşi Kart",
  "Filozof",
  "Grup Annesi",
  "Sessiz Gözlemci",
  "Trend Belirleyici",
  "Yargıç",
];

/** Sıralamaya göre rol atar (1. en çok seçilen vb.) */
function titleForRank(rank: number): string {
  return TITLES_BY_RANK[Math.min(rank - 1, TITLES_BY_RANK.length - 1)] ?? "Oyuncu";
}

/** Her oyuncu için benzersiz yorum: sıralama, oran ve şablon çeşitliliği kullanılır */
function buildComment(
  nickname: string,
  modeName: string,
  rank: number,
  totalPlayers: number,
  timesChosen: number,
  totalQuestions: number,
  seed: number
): string {
  const ratio = totalQuestions > 0 ? (timesChosen / totalQuestions) * 100 : 0;
  const isTop = rank === 1;
  const isSecond = rank === 2;
  const isLast = rank === totalPlayers && totalPlayers > 1;
  const isMiddle = rank > 2 && rank < totalPlayers;

  const templatesTop = [
    `${nickname} bu ${modeName} oturumunda grubun odağındaydı. Sorulara verilen yanıtlar, arkadaşlarının onu sık sık akıllarına getirdiğini gösteriyor. Bu tür bir görünürlük genelde güven ve samimiyetle el ele gider; grupta “referans noktası” olarak görülüyor olabilir.`,
    `${nickname} en çok seçilen isimlerden biri oldu. Bu ${modeName} turunda gruptaki yerinin ne kadar merkezî algılandığını görüyoruz. İnsanlar onu düşünürken muhtemelen belirli anılar veya özellikler canlanıyordur; yorumlar bu açıdan oldukça anlamlı.`,
    `${nickname} bu turda grubun zihninde öne çıkan isimlerden. Seçimler, onun ${modeName} temalarıyla nasıl özdeşleştiğini yansıtıyor. Güçlü bir “ilk akla gelen” figür; bu da gruptaki ilişki dinamiğinin derinliğine işaret edebilir.`,
  ];
  const templatesSecond = [
    `${nickname} listenin hemen arkasında; birçok soruda akıllara geldi. ${modeName} bağlamında grupta güçlü bir konuma sahip, fakat tek odak noktası değil. Bu denge, hem görünür hem de “gizli” bir rol oynadığını düşündürüyor.`,
    `${nickname} ikinci sırada yer alıyor. Sorulara verilen cevaplar, onun da grubun önemli bir parçası olduğunu gösteriyor. Belirli konularda öne çıkıyor, diğerlerinde ise daha geride; bu da çok yönlü bir grup algısına işaret ediyor.`,
    `${nickname} bu ${modeName} oturumunda sıkça anıldı. İkinci sıradaki konumu, grupta “hem görünür hem stratejik” bir yerde durduğunu ima ediyor. İnsanlar onu düşünürken muhtemelen net özellikler veya anlar çağrışıyor.`,
  ];
  const templatesMiddle = [
    `${nickname} bazı sorularda öne çıktı, bazılarında arka planda kaldı. Bu dağılım, grupta tek bir etiketle tanımlanmadığını gösteriyor. Farklı bağlamlarda farklı yönleriyle akıllara geliyor; bu çeşitlilik ilişki dinamikleri için sağlıklı bir işaret.`,
    `${nickname} orta sıralarda; ne tam önde ne tam arkada. ${modeName} sorularına verilen yanıtlar, onun belirli durumlarda öne çıktığını, diğerlerinde ise daha az görünür olduğunu gösteriyor. Dengeli bir profil.`,
    `${nickname} grupta “ara bölgede” konumlanıyor. Bu, tek bir kalıba sığmadığı anlamına gelebilir. Bazı sorularda ilk akla gelen, bazılarında ikinci planda; bu tür bir dağılım genelde çok boyutlu bir algıya işaret eder.`,
  ];
  const templatesLow = [
    `${nickname} bu turda daha az seçildi; bu mutlaka olumsuz bir şey değil. Bazen en etkili kişi, her soruda “cevap” olarak görülen değil, grubun havasını ve yönünü şekillendirendir. Az görünürlük, daha az tanınmak anlamına gelmez.`,
    `${nickname} seçimlerde daha az öne çıktı. ${modeName} soruları ışığında grupta farklı bir yeri var: belki “sessiz güç” ya da “arka planda tutan” rol. Bu tür profiller genelde ilişkide denge unsuru olur.`,
    `${nickname} bu oturumda daha az anıldı. Bu, gruptaki önemini düşürmez; sadece bu soru setinde farklı bir konumda kaldığını gösterir. Bazen az “seçilen” isim, aslında grubun dinamiğini en çok gözlemleyen ve yönlendirendir.`,
  ];

  let pool: string[];
  if (isTop) pool = templatesTop;
  else if (isSecond) pool = templatesSecond;
  else if (isLast && ratio < 40) pool = templatesLow;
  else if (isMiddle) pool = templatesMiddle;
  else if (ratio >= 50) pool = templatesTop;
  else if (ratio >= 25) pool = templatesMiddle;
  else pool = templatesLow;

  const idx = seed % pool.length;
  return pool[idx]!;
}

/**
 * Mock AI analysis. Her oyuncu için sıralama ve orana göre benzersiz yorum üretir.
 * questionStats verilirse her oyuncu için soru bazında detaylı inceleme (questionInsights) eklenir.
 */
export function mockAnalyze(input: AnalyzeInput): AnalyzeResult {
  const { players, modeName, selectionByPlayer, totalQuestions, questionStats } = input;

  const withStats = players.map((p) => ({
    ...p,
    timesChosen: selectionByPlayer[p.id] ?? 0,
  }));
  withStats.sort((a, b) => b.timesChosen - a.timesChosen);

  const rankByPlayerId = new Map<string, number>();
  withStats.forEach((p, i) => {
    rankByPlayerId.set(p.id, i + 1);
  });

  const playerAnalyses: PlayerAnalysis[] = players.map((p, playerIndex) => {
    const timesChosen = selectionByPlayer[p.id] ?? 0;
    const rank = rankByPlayerId.get(p.id) ?? playerIndex + 1;
    const totalPlayers = players.length;
    const seed = p.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const comment = buildComment(
      p.nickname,
      modeName,
      rank,
      totalPlayers,
      timesChosen,
      totalQuestions,
      seed
    );
    const title = titleForRank(rank);

    const questionInsights: QuestionInsight[] | undefined = questionStats?.map((q) => {
      const percent = q.selectionPercentByPlayer[p.id] ?? 0;
      const insight = buildQuestionInsight(p.nickname, q.questionText, percent, seed + q.questionId.length);
      return { questionText: q.questionText, percent, insight };
    });

    return {
      playerId: p.id,
      nickname: p.nickname,
      comment,
      title,
      selectionStats: { timesChosen, totalQuestions },
      ...(questionInsights && questionInsights.length > 0 ? { questionInsights } : {}),
    };
  });

  const groupSummary = `Grup dinamiği, sorular ışığında birbirlerini nasıl gördüğünüzü yansıtıyor.`;

  return { playerAnalyses, groupSummary };
}

/** Vote matrix'ten soru bazlı seçilme sayısı ve toplam soru üretir */
export function getSelectionStats(
  voteMatrix: VoteRecord[],
  playerIds: string[]
): { selectionByPlayer: Record<string, number>; totalQuestions: number } {
  const questionIds = new Set(voteMatrix.map((v) => v.questionId));
  const totalQuestions = questionIds.size;
  const selectionByPlayer: Record<string, number> = {};
  playerIds.forEach((id) => {
    selectionByPlayer[id] = 0;
  });
  const chosenPerQuestion = new Map<string, Set<string>>();
  voteMatrix.forEach((v) => {
    const key = v.questionId;
    if (!chosenPerQuestion.has(key)) chosenPerQuestion.set(key, new Set());
    chosenPerQuestion.get(key)!.add(v.votedForId);
  });
  chosenPerQuestion.forEach((playerSet) => {
    playerSet.forEach((playerId) => {
      selectionByPlayer[playerId] = (selectionByPlayer[playerId] ?? 0) + 1;
    });
  });
  return { selectionByPlayer, totalQuestions };
}

export interface QuestionText { id: string; text: string }

/**
 * Her soru için: o soruda kaç oy kullanıldı ve her oyuncu o soruda yüzde kaç oranında seçildi.
 * questionTexts: vote matrix'teki questionId'lere karşılık gelen soru metinleri.
 */
export function getQuestionLevelStats(
  voteMatrix: VoteRecord[],
  playerIds: string[],
  questionTexts: QuestionText[]
): QuestionLevelStat[] {
  const textById = new Map(questionTexts.map((q) => [q.id, q.text]));
  const byQuestion = new Map<string, VoteRecord[]>();
  voteMatrix.forEach((v) => {
    if (!byQuestion.has(v.questionId)) byQuestion.set(v.questionId, []);
    byQuestion.get(v.questionId)!.push(v);
  });

  return Array.from(byQuestion.entries()).map(([questionId, votes]) => {
    const voterCount = votes.length;
    const votedForCount: Record<string, number> = {};
    playerIds.forEach((id) => {
      votedForCount[id] = 0;
    });
    votes.forEach((v) => {
      if (votedForCount[v.votedForId] !== undefined) {
        votedForCount[v.votedForId]++;
      }
    });
    const selectionPercentByPlayer: Record<string, number> = {};
    const divisor = voterCount > 0 ? voterCount : 1;
    playerIds.forEach((id) => {
      selectionPercentByPlayer[id] = Math.round((votedForCount[id]! / divisor) * 100);
    });
    return {
      questionId,
      questionText: textById.get(questionId) ?? "",
      voterCount,
      selectionPercentByPlayer,
    };
  });
}

/** Soru metni ve seçilme yüzdesine göre kısa inceleme cümlesi üretir */
function buildQuestionInsight(
  nickname: string,
  questionText: string,
  percent: number,
  seed: number
): string {
  const templatesHigh = [
    `"${questionText}" sorusunda ${nickname} grubun büyük çoğunluğunun aklına geldi (%${percent}). Bu soru bağlamında grupta güçlü bir çağrışım yaratıyor.`,
    `Bu soruda ${nickname} belirgin biçimde öne çıktı (%${percent}). Sorunun temasıyla özdeşleşen bir profil olarak algılanıyor.`,
    `"${questionText}" — ${nickname} bu soruda yüksek oranda seçildi (%${percent}). Gruptaki konumunu bu bağlamda net biçimde yansıtıyor.`,
  ];
  const templatesMid = [
    `"${questionText}" sorusunda ${nickname} bir kısım oy alarak görünür oldu (%${percent}). Bu tema ile ilişkide dengeli bir konumda.`,
    `Bu soruda ${nickname} orta düzeyde akıllara geldi (%${percent}). Soru bağlamında grupta belirli bir yeri var.`,
    `"${questionText}" — ${nickname} bu soruda %${percent} oranında seçildi. Temayla örtüşen bir profil olarak görülüyor.`,
  ];
  const templatesLow = [
    `"${questionText}" sorusunda ${nickname} daha az seçildi (%${percent}). Bu soru setinde farklı bir profil çiziyor; diğer sorularda öne çıkabilir.`,
    `Bu soruda ${nickname} düşük oranda anıldı (%${percent}). Sorunun odağı bu kişi üzerinde değil; bu da ilişki çeşitliliğini gösterir.`,
    `"${questionText}" — ${nickname} bu bağlamda %${percent} ile daha az öne çıktı. Tek bir soru tüm dinamikleri yansıtmaz.`,
  ];
  const pool =
    percent >= 50 ? templatesHigh : percent >= 25 ? templatesMid : templatesLow;
  const idx = seed % pool.length;
  return pool[idx]!;
}

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
  // Future: if (process.env.OPENAI_API_KEY) return getAnalysisFromOpenAI(input);
  return Promise.resolve(mockAnalyze(input));
}
