import asyncio
import os
import edge_tts

VOICEOVER_LINES = {
    "line1": "Dost toh sabke paas hote hain.",
    "line2": "Par karne waale kitne hain?",
    "line3": "Koi hai jo subah 6 baje run pe chale?",
    "line4": "Koi jo bole, bhai… aaj woh idea banaate hain?",
    "line5": "Koi jo weekend pe randomly trek karne ke liye haan bol de?",
    "line6": "Maybe you don't need more friends.",
    "line7": "You just need to find the ones who are down.",
    "line8": "Jeevan saathi ka pata nahi…",
    "line9": "Abhi ka saathi mil jayega."
}

VOICE = "hi-IN-MadhurNeural"
OUTPUT_DIR = "assets/audio"

async def generate_tts(text, output_file):
    print(f"Generating voiceover: '{text}' -> {output_file}")
    communicate = edge_tts.Communicate(text, VOICE, rate="+0%")
    await communicate.save(output_file)

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for name, text in VOICEOVER_LINES.items():
        output_file = os.path.join(OUTPUT_DIR, f"{name}.mp3")
        await generate_tts(text, output_file)
    print("TTS Voiceover generation complete!")

if __name__ == "__main__":
    asyncio.run(main())
