"""Toigo background music — an original komuz-style loop, synthesized from scratch.

No samples or recordings are used, so the track is fully ours (no copyright issues).
Run:  python3 tools/music.py  → public/assets/audio/toi-music-3.{m4a,webm}
"""
import subprocess, wave, pathlib
import numpy as np

SR = 44100
BPM = 104
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
_cache = {}
def pluck(midi, dur=1.6, bright=0.5, var=0):
    """Karplus–Strong plucked string (komuz-like), pitch-corrected by resampling."""
    key = (midi, round(dur, 2), bright, var)
    if key in _cache: return _cache[key]
    f = hz(midi); N = int(SR / f); n = int(dur * SR) + N
    r = np.random.default_rng(hash(key) & 0xFFFF)
    y = np.zeros(n)
    y[:N] = r.uniform(-1, 1, N)
    # soften the excitation: darker strings for lower brightness
    for _ in range(int((1 - bright) * 4)): y[1:N] = 0.5 * (y[1:N] + y[:N - 1])
    decay = 0.996 + bright * 0.003
    k = 1
    while k * N < n:
        a, b = k * N, min((k + 1) * N, n)
        prev = y[a - N:b - N]
        prev2 = np.concatenate(([y[a - N - 1] if a - N - 1 >= 0 else 0.0], y[a - N:b - N - 1]))
        y[a:b] = 0.5 * (prev + prev2) * decay
        k += 1
    # correct pitch: generated at SR/N, wanted f
    ratio = (SR / N) / f
    t = np.arange(0, n - 1, ratio)
    y = np.interp(t, np.arange(n), y)[: int(dur * SR)]
    y -= y.mean()
    env = np.ones_like(y); fade = int(0.03 * SR); env[-fade:] = np.linspace(1, 0, fade)
    y *= env / (np.abs(y).max() + 1e-9)
    _cache[key] = y
    return y

def sine_pluck(midi, dur):
    t = np.arange(int(dur * SR)) / SR
    f = hz(midi)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    env = (1 - np.exp(-t * 300)) * np.exp(-t * 3.2)
    return y * env

def pad(midis, dur):
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for m in midis:
        for d in (-0.08, 0.08):
            f = hz(m) * 2 ** (d / 12)
            y += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) + 0.3 * np.sin(4 * np.pi * f * t)
    a = int(0.6 * SR); env = np.ones_like(t)
    env[:a] = np.linspace(0, 1, a); env[-a:] = np.linspace(1, 0, a)
    return y * env / len(midis)

def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 52 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def shaker():
    t = np.arange(int(0.07 * SR)) / SR
    n = rng.uniform(-1, 1, len(t)); n = np.diff(n, prepend=0)  # high-passed noise
    return n * np.exp(-t * 70) * (1 - np.exp(-t * 900))

def drum():  # soft hand drum (dool)
    t = np.arange(int(0.3 * SR)) / SR
    f = 120 + 60 * np.exp(-t * 40)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    y += 0.25 * rng.uniform(-1, 1, len(t)) * np.exp(-t * 60)
    return y

# ---------- score ----------
CH = {"D": [50, 57, 62], "G": [43, 50, 55], "A": [45, 52, 57], "Bm": [47, 54, 59]}
PAD = {"D": [62, 66, 69], "G": [62, 67, 71], "A": [61, 64, 69], "Bm": [62, 66, 71]}
PROG = [["D"], ["D"], ["G"], ["A"], ["D"], ["Bm"], ["G", "A"], ["D"]]

A = [  # (beat, length, midi) per bar
    [(0, .5, 74), (.5, .5, 76), (1, 1, 78), (2, .5, 76), (2.5, .5, 74), (3, 1, 71)],
    [(0, 1.5, 69), (1.5, .5, 71), (2, 2, 74)],
    [(0, .5, 71), (.5, .5, 74), (1, 1, 76), (2, .5, 74), (2.5, .5, 71), (3, 1, 67)],
    [(0, 1, 69), (1, .5, 71), (1.5, .5, 69), (2, 2, 64)],
    [(0, .5, 74), (.5, .5, 76), (1, 1, 78), (2, 1, 81), (3, .5, 78), (3.5, .5, 76)],
    [(0, 1, 74), (1, 1, 71), (2, .5, 74), (2.5, .5, 71), (3, 1, 66)],
    [(0, .5, 67), (.5, .5, 71), (1, 1, 74), (2, .5, 76), (2.5, .5, 73), (3, 1, 69)],
    [(0, 3, 74)],
]
B = [
    [(0, .25, 78), (.25, .25, 76), (.5, .5, 74), (1, .25, 78), (1.25, .25, 76), (1.5, .5, 74), (2, 1, 81), (3, 1, 78)],
    [(0, .5, 76), (.5, .5, 74), (1, .5, 76), (1.5, .5, 78), (2, 2, 74)],
    [(0, .5, 74), (.5, .5, 79), (1, .5, 78), (1.5, .5, 76), (2, 1, 74), (3, 1, 71)],
    [(0, 1, 76), (1, .5, 73), (1.5, .5, 76), (2, 2, 81)],
    [(0, .25, 78), (.25, .25, 76), (.5, .5, 74), (1, .25, 78), (1.25, .25, 76), (1.5, .5, 74), (2, 1, 69), (3, 1, 74)],
    [(0, 1.5, 78), (1.5, .5, 76), (2, 1, 74), (3, 1, 71)],
    [(0, .5, 71), (.5, .5, 74), (1, 1, 79), (2, .5, 76), (2.5, .5, 73), (3, 1, 76)],
    [(0, 2, 74), (2, .5, 69), (2.5, .5, 71), (3, 1, 74)],
]
# sections: (melody, strum, bass, drums, pad)
SECTIONS = [(None, 1, 0, 0, 1)] * 4 + [(A[i], 1, 1, 1, 1) for i in range(8)] + \
           [(B[i], 1, 1, 2, 1) for i in range(8)] + [(A[i], 1, 1, 2, 1) for i in range(8)]
BARS = len(SECTIONS)
LEN = int(BARS * BAR * SR)
STEMS = {}
L = np.zeros(LEN + 4 * SR); R = np.zeros_like(L)

def put(sig, t, gain=1.0, pan=0.0, stem='x'):
    i = max(0, int(t * SR))
    if i >= len(L): return
    s = sig[: len(L) - i] * gain
    st_ = STEMS.setdefault(stem, np.zeros(len(L))); st_[i:i + len(s)] += s
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan)) * 1.414
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan)) * 1.414

KICK, DRUM = kick(), drum()
for b, (mel, strum, bass, drums, padon) in enumerate(SECTIONS):
    t0 = b * BAR
    chords = PROG[b % 8] if b >= 4 else PROG[b]
    for beat in range(4):
        ch = chords[0] if len(chords) == 1 or beat < 2 else chords[1]
        tb = t0 + beat * BEAT
        hum = lambda: rng.normal(0, 0.006)
        # komuz gallop strum: 8th + two 16ths
        if strum:
            for off, vel in ((0, 1.0), (.5, .6), (.75, .7)):
                for j, m in enumerate(CH[ch]):
                    put(pluck(m + 12, 0.9, 0.35, j % 3), tb + off * BEAT + j * 0.012 + hum(), 0.13 * vel, -0.35, 'strum')
        if bass and beat in (0, 2):
            put(sine_pluck(CH[ch][0] - 12, 1.2), tb, 0.18, 0, 'bass')
        if bass and beat == 3:
            put(sine_pluck(CH[ch][0] - 5, 0.4), tb + 0.5 * BEAT, 0.10, 0, 'bass')
        if drums:
            if beat in (0, 2): put(KICK, tb, 0.27, 0, 'kick')
            if drums == 2 and beat in (1, 3): put(DRUM, tb, 0.20, 0.2, 'drum')
            for s in range(4): put(shaker(), tb + s * BEAT / 4 + hum(), (0.05 if s % 2 else 0.08), 0.4, 'shaker')
        elif b >= 2:
            for s in range(2): put(shaker(), tb + s * BEAT / 2, 0.04, 0.4, 'shaker')
        if padon and beat == 0:
            for k, c in enumerate(chords):
                put(pad(PAD[c], BAR / len(chords) + 0.6), t0 + k * BAR / len(chords), 0.05, 0, 'pad')
    if mel:
        oct_up = b >= 20 and b % 2 == 1  # final A: light octave double on alternate bars
        for beat, ln, m in mel:
            t = t0 + beat * BEAT + rng.normal(0, 0.004)
            put(pluck(m, max(0.6, ln * BEAT + 0.5), 0.6, 0), t, 0.85, 0.25, 'mel')
            if oct_up: put(pluck(m + 12, 0.5, 0.6, 1), t + 0.01, 0.20, 0.5, 'mel')

for k_, v_ in STEMS.items(): print(k_, round(20*np.log10(np.sqrt((v_**2).mean())+1e-12),1), 'dB rms')
# ---------- reverb, seamless loop, master ----------
ir_len = int(1.6 * SR); t = np.arange(ir_len) / SR
ir = rng.normal(0, 1, ir_len) * np.exp(-t * 3.2); ir[0] = 0
def conv(x):
    n = 1 << int(np.ceil(np.log2(len(x) + ir_len)))
    return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
L = L + 0.035 * conv(L); R = R + 0.035 * conv(R)
# wrap the tail after the last bar onto the start so the loop is seamless
tail = len(L) - LEN
L[:tail] += L[LEN:]; R[:tail] += R[LEN:]
L, R = L[:LEN], R[:LEN]
st = np.stack([L, R], 1)
st *= 10 ** (-1 / 20) / np.abs(st).max()

out = pathlib.Path(__file__).resolve().parent.parent / "public/assets/audio"
wav = pathlib.Path("/tmp/toigo-music.wav")
with wave.open(str(wav), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
# Gentle background level: -18 LUFS (quieter than typical music, never shouty).
meas = subprocess.run(["ffmpeg", "-i", str(wav), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
lufs = float(meas.split("Integrated loudness:")[1].split("I:")[1].split("LUFS")[0])
gain = 10 ** ((-18 - lufs) / 20)
print(f"measured {lufs:.1f} LUFS, gain {gain:.2f}")
if gain < 1:
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * gain * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", str(out / "toi-music-3.m4a")], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libopus", "-b:a", "80k", str(out / "toi-music-3.webm")], check=True)
print(f"{BARS} bars, {LEN / SR:.1f}s →", out)
