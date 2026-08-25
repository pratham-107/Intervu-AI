import re
from typing import Dict, List, Tuple

FILLER_WORDS = [
    r"\bum\b",
    r"\buh\b",
    r"\buhh\b",
    r"\bumm\b",
    r"\blike\b",
    r"\byou know\b",
    r"\bbasically\b",
    r"\bactually\b",
    r"\bliterally\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\bmean\b",
    r"\bright\b"
]

COMPILED_FILLERS = [re.compile(pattern, re.IGNORECASE) for pattern in FILLER_WORDS]

class SpeechAnalytics:
    @staticmethod
    def count_filler_words(text: str) -> Tuple[int, Dict[str, int]]:
        if not text:
            return 0, {}
        
        counts = {}
        total = 0
        for pattern in COMPILED_FILLERS:
            matches = pattern.findall(text)
            if matches:
                name = matches[0].lower()
                counts[name] = len(matches)
                total += len(matches)
        return total, counts

    @staticmethod
    def calculate_wpm(word_count: int, duration_seconds: float) -> int:
        if duration_seconds <= 0 or word_count == 0:
            return 0
        minutes = duration_seconds / 60.0
        return int(word_count / minutes)

    @staticmethod
    def get_pace_assessment(wpm: int) -> str:
        if wpm == 0:
            return "Listening..."
        if wpm < 110:
            return "Slightly Slow — Try to maintain momentum"
        if 110 <= wpm <= 165:
            return "Optimal Interview Pace (Clear & Confident)"
        return "Fast Pace — Consider pausing between key points"
