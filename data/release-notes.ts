import payload from "./whats-new.json";

export interface ReleaseHighlight {
  title: string;
  description: string;
  area: string;
  isEarlyAdopter?: boolean;
  isGeneralAvailability?: boolean;
  regions: string[];
  relatedConceptId?: string;
}

export interface ReleaseSection {
  area: string;
  features: {
    title: string;
    description: string;
    isEarlyAdopter?: boolean;
    isGA?: boolean;
    regions: string[];
    relatedConceptId?: string;
  }[];
}

export const RELEASE_VERSION = payload.version;
export const RELEASE_DATE = payload.date;
export const RELEASE_SOURCE_URL = payload.sourceUrl;

export const highlights: ReleaseHighlight[] = payload.highlights.map((item) => ({
  title: item.title,
  description: item.description,
  area: item.area,
  isEarlyAdopter: item.isEarlyAdopter,
  isGeneralAvailability: item.isGeneralAvailability,
  regions: item.regions,
  relatedConceptId: item.relatedConceptId,
}));

export const allChanges: ReleaseSection[] = payload.allChanges.map((section) => ({
  area: section.area,
  features: section.features.map((feature) => ({
    title: feature.title,
    description: feature.description,
    isEarlyAdopter: feature.isEarlyAdopter,
    isGA: feature.isGA,
    regions: feature.regions,
    relatedConceptId: feature.relatedConceptId,
  })),
}));
