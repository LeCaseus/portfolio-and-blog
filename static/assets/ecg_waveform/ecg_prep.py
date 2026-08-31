# Source: MIT-BIH Normal Sinus Rhythm Database v1.0.0 (PhysioNet)
# https://physionet.org/content/nsrdb/1.0.0/
# License: Open Data Commons Attribution License v1.0
#
# wget https://physionet.org/files/nsrdb/1.0.0/16265.dat
# wget https://physionet.org/files/nsrdb/1.0.0/16265.hea
#
# Citation:
# Pollard, T., Moody, B. E., Lehman, L., Gow, B., Fernandes, C., Xie, C.,
# Johnson, A., Mark, R. G., & Heldt, T. (2026). PhysioNet as a global
# platform for biomedical research. Nature Health.
# https://doi.org/10.1038/s44360-026-00096-z

import json
import numpy as np
import wfdb

RECORD = "16265"
CHANNEL = 0
START_SECONDS = 0
WINDOW_SECONDS = 10

record = wfdb.rdrecord(
    RECORD,
    sampfrom=START_SECONDS * 128,
    sampto=(START_SECONDS + WINDOW_SECONDS) * 128,
)
raw = record.p_signal[:, CHANNEL]

centered = raw - np.mean(raw)
peak = np.max(np.abs(centered))
normalized = centered / peak

samples = [round(float(v), 4) for v in normalized]

with open("ecg_loop.json", "w") as f:
    json.dump({
        "citation": "Pollard, T., Moody, B. E., Lehman, L., Gow, B., Fernandes, C., Xie, C., Johnson, A., Mark, R. G., & Heldt, T. (2026). PhysioNet as a global platform for biomedical research. Nature Health. https://doi.org/10.1038/s44360-026-00096-z",
        "license": "ODC-BY 1.0",
        "sampleRateHz": record.fs,
        "samples": samples,
    }, f)

print(f"{len(samples)} samples @ {record.fs}Hz ({len(samples) / record.fs:.2f}s)")
