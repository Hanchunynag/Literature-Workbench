function normalizeHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .trim();
}

function pickBlocks(rawText: string) {
  return rawText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 60);
}

function collectSectionBlocks(blocks: string[], headingPatterns: string[], maxBlocks: number) {
  const selected: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const heading = normalizeHeading(block.split("\n")[0] ?? block);

    if (!headingPatterns.some((pattern) => heading.startsWith(pattern))) {
      continue;
    }

    for (let offset = 0; offset < maxBlocks && index + offset < blocks.length; offset += 1) {
      selected.push(blocks[index + offset]);
    }

    break;
  }

  return selected;
}

function collectRepresentativeBlocks(blocks: string[], count: number) {
  if (blocks.length <= count) {
    return blocks;
  }

  const positions = [0, Math.floor(blocks.length / 3), Math.floor((blocks.length * 2) / 3)];

  return positions
    .slice(0, count)
    .map((position) => blocks[position])
    .filter(Boolean);
}

function trimToBudget(sections: string[], maxChars: number) {
  const chunks: string[] = [];
  let remaining = maxChars;

  for (const section of sections) {
    if (remaining <= 0) {
      break;
    }

    const content = section.trim();

    if (!content) {
      continue;
    }

    const nextChunk = content.length <= remaining ? content : `${content.slice(0, remaining - 1)}…`;
    chunks.push(nextChunk);
    remaining -= nextChunk.length + 2;
  }

  return chunks.join("\n\n");
}

const SECTION_HINTS = [
  "abstract",
  "摘要",
  "introduction",
  "引言",
  "method",
  "methods",
  "experiment",
  "experiments",
  "results",
  "discussion",
  "conclusion",
  "conclusions",
  "结论",
  "关键词",
  "keywords"
];

const JOURNAL_METADATA_HINTS = [
  "journal of",
  "vol ",
  "vol.",
  "volume",
  "no ",
  "no.",
  "issn",
  "october",
  "pages",
  "学报",
  "第",
  "卷",
  "期"
];

function countReadableChars(value: string) {
  return (value.match(/[A-Za-z0-9\u4e00-\u9fa5]/g) ?? []).length;
}

export function assessAgentReadiness(input: {
  title: string;
  authors?: string[];
  abstractText?: string;
  conclusionExcerpt?: string;
  keywords?: string[];
  extractedText: string;
}) {
  const normalizedTitle = normalizeHeading(input.title);
  const normalizedText = input.extractedText.toLowerCase();
  const normalizedAbstract = input.abstractText?.trim() ?? "";
  const normalizedConclusion = input.conclusionExcerpt?.trim() ?? "";
  const keywords = (input.keywords ?? []).map((item) => item.trim()).filter(Boolean);
  const blocks = pickBlocks(input.extractedText);
  const readableChars = countReadableChars(input.extractedText);
  const hasSectionHints = SECTION_HINTS.some((hint) => normalizedText.includes(hint));
  const titleLooksLikeJournalMeta = JOURNAL_METADATA_HINTS.some((hint) =>
    normalizedTitle.includes(hint.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").trim())
  );
  const textLooksLikeJournalMeta =
    JOURNAL_METADATA_HINTS.filter((hint) => normalizedText.includes(hint)).length >= 3;

  if (normalizedAbstract || normalizedConclusion || keywords.length > 0) {
    return {
      usable: true,
      reason: "structured-sections-provided"
    };
  }

  if (readableChars < 900) {
    return {
      usable: false,
      reason: "no-usable-abstract-or-conclusion"
    };
  }

  if (blocks.length < 3 && !hasSectionHints) {
    return {
      usable: false,
      reason: "no-usable-abstract-or-conclusion"
    };
  }

  if ((titleLooksLikeJournalMeta || textLooksLikeJournalMeta) && !hasSectionHints) {
    return {
      usable: false,
      reason: "journal-metadata-without-summary-sections"
    };
  }

  return {
    usable: true,
    reason: "usable"
  };
}

export function buildAgentContext(input: {
  title: string;
  abstractText?: string;
  extractedText: string;
  maxChars?: number;
}) {
  const maxChars = input.maxChars ?? 4500;
  const blocks = pickBlocks(input.extractedText);
  const selectedSections = [
    input.title.trim() ? `标题:\n${input.title.trim()}` : "",
    input.abstractText?.trim() ? `摘要:\n${input.abstractText.trim()}` : "",
    ...collectSectionBlocks(blocks, ["abstract", "摘要"], 2).map((block) => `摘要候选:\n${block}`),
    ...collectSectionBlocks(blocks, ["introduction", "1 introduction", "引言"], 2).map(
      (block) => `引言片段:\n${block}`
    ),
    ...collectSectionBlocks(blocks, ["conclusion", "conclusions", "结论"], 2).map(
      (block) => `结论片段:\n${block}`
    ),
    ...collectRepresentativeBlocks(blocks, 3).map((block) => `正文片段:\n${block}`)
  ];

  const dedupedSections = Array.from(new Set(selectedSections.filter(Boolean)));

  return trimToBudget(dedupedSections, maxChars);
}
