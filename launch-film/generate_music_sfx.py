import os
import numpy as np
import scipy.io.wavfile as wav

SR = 44100  # Sample rate

def make_kick(duration=0.15, amp=0.55):
    t = np.arange(int(SR * duration)) / SR
    freq = 150 * np.exp(-t * 30) + 42
    wave = np.sin(2 * np.pi * freq * t) * np.exp(-t * 20)
    return wave * amp

def make_snare(duration=0.25, amp=0.35):
    t = np.arange(int(SR * duration)) / SR
    noise = np.random.uniform(-1, 1, len(t))
    # Decaying noise bandpass representation
    wave = noise * np.exp(-t * 18)
    # Add mid tone for punch
    body = np.sin(2 * np.pi * 170 * t) * np.exp(-t * 25) * 0.12
    return (wave + body) * amp

def make_hihat(duration=0.04, amp=0.2):
    t = np.arange(int(SR * duration)) / SR
    noise = np.random.uniform(-1, 1, len(t))
    wave = noise * np.exp(-t * 70)
    return wave * amp

def make_bass_note(duration=0.3, freq=55, amp=0.35):
    t = np.arange(int(SR * duration)) / SR
    wave = np.sin(2 * np.pi * freq * t) * np.exp(-t * 10)
    # Add slight tube saturation
    wave = np.clip(wave * 1.6, -0.9, 0.9)
    return wave * amp

def generate_sfx():
    os.makedirs("assets/audio", exist_ok=True)
    
    # 1. Static/Glitch Hit
    t = np.arange(int(SR * 1.2)) / SR
    noise = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 12)
    sub = np.sin(2 * np.pi * (60 * np.exp(-t * 10) + 30) * t) * np.exp(-t * 3) * 0.5
    static_hit = (noise * 0.35 + sub * 0.65)
    wav.write("assets/audio/static_hit.wav", SR, (np.clip(static_hit, -1.0, 1.0) * 32767).astype(np.int16))
    
    # 2. UI Tick
    t = np.arange(int(SR * 0.015)) / SR
    tick = np.sin(2 * np.pi * 2000 * t) * np.exp(-t * 180) * 0.4
    wav.write("assets/audio/tick.wav", SR, (tick * 32767).astype(np.int16))
    
    # 3. Whoosh
    duration = 0.8
    t = np.arange(int(SR * duration)) / SR
    noise = np.random.uniform(-1, 1, len(t))
    # Simple whoosh filter: modulate volume & pitch sweep
    sweep_envelope = np.sin(np.pi * t / duration) ** 2
    whoosh = noise * sweep_envelope * 0.3
    wav.write("assets/audio/whoosh.wav", SR, (whoosh * 32767).astype(np.int16))
    
    # 4. LOCKED Chime
    t = np.arange(int(SR * 0.6)) / SR
    chime1 = np.sin(2 * np.pi * 523.25 * t) * np.exp(-t * 10)  # C5
    chime2 = np.zeros(len(t))
    delay = int(SR * 0.08)
    chime2[delay:] = np.sin(2 * np.pi * 659.25 * t[:-delay]) * np.exp(-t[:-delay] * 8)  # E5
    locked_chime = (chime1 * 0.4 + chime2 * 0.4)
    wav.write("assets/audio/locked_chime.wav", SR, (locked_chime * 32767).astype(np.int16))
    
    # 5. Type Click (keyboard)
    t = np.arange(int(SR * 0.012)) / SR
    click = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 220) * 0.35
    wav.write("assets/audio/type_click.wav", SR, (click * 32767).astype(np.int16))
    
    # 6. Logo Impact
    t = np.arange(int(SR * 2.5)) / SR
    noise = np.random.uniform(-1, 1, len(t)) * np.exp(-t * 8) * 0.25
    kick = np.sin(2 * np.pi * (130 * np.exp(-t * 12) + 38) * t) * np.exp(-t * 2.5) * 0.65
    impact = (noise + kick)
    impact = np.clip(impact * 1.5, -0.95, 0.95)
    wav.write("assets/audio/logo_impact.wav", SR, (impact * 32767).astype(np.int16))
    
    # 7. Bass Impact
    t = np.arange(int(SR * 1.5)) / SR
    bass = np.sin(2 * np.pi * (65 * np.exp(-t * 6) + 30) * t) * np.exp(-t * 2) * 0.6
    wav.write("assets/audio/bass_impact.wav", SR, (bass * 32767).astype(np.int16))

def generate_music():
    duration = 35  # 35 seconds
    length = SR * duration
    audio = np.zeros(length)
    
    # Pre-render patterns
    kick = make_kick()
    snare = make_snare()
    hihat = make_hihat()
    
    # 1. 0.0s - 4.0s: Low sub drone
    t_intro = np.arange(int(SR * 4.0)) / SR
    intro_drone = np.sin(2 * np.pi * 50 * t_intro) * 0.08
    audio[0:len(intro_drone)] += intro_drone
    
    # We will lay out beats at 142 BPM
    bpm = 142.0
    beat_dur = 60.0 / bpm  # ~0.4225s
    eighth_dur = beat_dur / 2
    sixteenth_dur = beat_dur / 4
    
    # Start placing drum hits
    # Section 2: 4.0s - 7.0s: Ticking hihats
    start_sec2 = 4.0
    end_sec2 = 7.0
    t = start_sec2
    while t < end_sec2:
        idx = int(t * SR)
        if idx < length:
            audio[idx : idx + len(hihat)] += hihat * 0.6
        t += eighth_dur
        
    # Section 3: 7.0s - 16.0s: Side quests build (Whiplash swing style)
    start_sec3 = 7.0
    end_sec3 = 16.0
    t = start_sec3
    beat_count = 0
    while t < end_sec3:
        idx = int(t * SR)
        bar_pos = beat_count % 4  # 4/4 time signature
        
        if idx < length:
            # Kick on beat 1 and 3
            if bar_pos == 0 or bar_pos == 2:
                audio[idx : idx + len(kick)] += kick * 0.8
                # Add sub bass pulse on kick
                bass = make_bass_note(duration=0.25, freq=55, amp=0.3)
                audio[idx : idx + len(bass)] += bass
                
            # Snare on beat 2 and 4
            if bar_pos == 1 or bar_pos == 3:
                audio[idx : idx + len(snare)] += snare * 0.7
                
            # Hihats on all 8th notes
            audio[idx : idx + len(hihat)] += hihat * 0.7
            eighth_idx = int((t + eighth_dur) * SR)
            if eighth_idx + len(hihat) < length:
                audio[eighth_idx : eighth_idx + len(hihat)] += hihat * 0.5
                
            # Snare ghost notes (16th notes) to create the obsessive Whiplash swing roll
            for offset in [1, 3]:
                ghost_idx = int((t + offset * sixteenth_dur) * SR)
                if ghost_idx + len(snare) < length:
                    # Snare hit with low amplitude
                    ghost_len = int(SR * 0.08)
                    audio[ghost_idx : ghost_idx + ghost_len] += snare[:ghost_len] * 0.15
                    
        t += beat_dur
        beat_count += 1
        
    # Section 4: 16.0s - 24.0s: Hero Campaign (Peak Intensity, double time feel)
    start_sec4 = 16.0
    end_sec4 = 24.0
    t = start_sec4
    beat_count = 0
    while t < end_sec4:
        idx = int(t * SR)
        bar_pos = beat_count % 4
        
        if idx < length:
            # Kick on every beat
            audio[idx : idx + len(kick)] += kick * 0.85
            # Snare on 2 and 4
            if bar_pos == 1 or bar_pos == 3:
                audio[idx : idx + len(snare)] += snare * 0.85
                
            # Rhythmic Bass pulse
            bass = make_bass_note(duration=0.2, freq=60 if bar_pos in [0,1] else 50, amp=0.45)
            audio[idx : idx + len(bass)] += bass
            
            # Hihats on all 8th notes (double-time swing)
            audio[idx : idx + len(hihat)] += hihat * 0.8
            eighth_idx = int((t + eighth_dur) * SR)
            if eighth_idx + len(hihat) < length:
                audio[eighth_idx : eighth_idx + len(hihat)] += hihat * 0.7
                
            # Intense 16th note snare rolls
            if beat_count % 8 in [6, 7]:  # Every 2 bars
                for offset in [1, 2, 3]:
                    roll_idx = int((t + offset * sixteenth_dur) * SR)
                    if roll_idx + len(snare) < length:
                        audio[roll_idx : roll_idx + len(snare)] += snare * 0.4
                        
        t += beat_dur
        beat_count += 1
        
    # Section 5: 24.0s - 29.0s: Drums Drop
    start_sec5 = 24.0
    t_drone = np.arange(int(SR * 5.0)) / SR
    drone = np.sin(2 * np.pi * 48 * t_drone) * 0.05
    drone_idx = int(start_sec5 * SR)
    audio[drone_idx : drone_idx + len(drone)] += drone
    
    # Section 6: 29.0s - 32.0s: Drum Roll Crescendo
    start_sec6 = 29.0
    end_sec6 = 32.0
    t = start_sec6
    roll_speed = sixteenth_dur  # Start at 16th note rolls
    while t < end_sec6:
        idx = int(t * SR)
        if idx < length:
            # Volume ramps up over time
            vol = (t - start_sec6) / (end_sec6 - start_sec6)
            audio[idx : idx + len(snare)] += snare * (0.2 + vol * 0.7)
            if idx + len(hihat) < length:
                audio[idx : idx + len(hihat)] += hihat * 0.4
        t += roll_speed
        # Accelerate the roll as it gets closer
        time_left = end_sec6 - t
        if time_left < 1.0:
            roll_speed = sixteenth_dur / 2  # 32nd note rolls!
            
    # Section 7: 32.0s Logo Impact Hit
    hit_idx = int(32.0 * SR)
    # Synthesize crash/impact wave
    t_hit = np.arange(int(SR * 3.0)) / SR
    crash_noise = np.random.uniform(-1, 1, len(t_hit)) * np.exp(-t_hit * 3.5) * 0.4
    crash_boom = np.sin(2 * np.pi * (100 * np.exp(-t_hit * 15) + 35) * t_hit) * np.exp(-t_hit * 1.5) * 0.75
    crash = (crash_noise + crash_boom)
    crash = np.clip(crash, -1.0, 1.0)
    audio[hit_idx : hit_idx + len(crash)] += crash
    
    # Write output to assets/audio/music.wav
    audio = np.clip(audio, -1.0, 1.0)
    wav.write("assets/audio/music.wav", SR, (audio * 32767).astype(np.int16))
    print("Music track generated successfully!")

if __name__ == "__main__":
    generate_sfx()
    generate_music()
