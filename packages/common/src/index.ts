import * as path from 'path';

export const DataDirectory = path.join(import.meta.dirname, "../../../data/");

export const PredefinedDirectories = {
    all: path.join(DataDirectory, "all"),
    recent: path.join(DataDirectory, "recent")
};

export const ReportDirectory = path.join(import.meta.dirname, "../../../reports/");

export const AICacheDirectory = path.join(import.meta.dirname, "../../../ai-cache/");

export const BatchDirectory = path.join(import.meta.dirname, "../../../batches/");
