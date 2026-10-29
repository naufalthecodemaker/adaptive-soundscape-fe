import { CloudRain, Wind, Waves, Droplets, AudioLines, LucideIcon } from "lucide-react";

export interface SoundTheme {
  key: "rain" | "wind" | "wave" | "water" | "default";
  label: string;
  background: string; // CSS gradient untuk halaman Play
  accent: string; // warna aksen (teks / ikon)
  ring: string; // warna lingkaran artwork
  artwork: string; // gradient untuk artwork
  playButtonSvg?: string; // SVG khusus untuk tombol play
  Icon: LucideIcon;
}

// Warna halaman Play berdasarkan profile suara
export function getSoundTheme(soundType?: string): SoundTheme {
  const t = (soundType || "").toLowerCase();

  if (t.includes("rain")) {
    return {
      key: "rain",
      label: "Rain",
      background: "linear-gradient(to bottom, #12151f 0%, #0c1a3d 55%, #12307a 100%)",
      accent: "#c7d7ff",
      ring: "#8A93B2",
      artwork: "radial-gradient(circle at 30% 30%, #6e86c2, #1f2f5c 70%)",
      playButtonSvg: "/small-play-rain-button.svg",
      Icon: CloudRain,
    };
  }
  if (t.includes("wind")) {
    return {
      key: "wind",
      label: "Wind",
      background: "linear-gradient(to bottom, #141a16 0%, #10281a 55%, #1b4a1a 100%)",
      accent: "#cdeccf",
      ring: "#8fc291",
      artwork: "radial-gradient(circle at 30% 30%, #7fc084, #1d4a2a 70%)",
      Icon: Wind,
    };
  }
  if (t.includes("wave")) {
    return {
      key: "wave",
      label: "Wave",
      background: "linear-gradient(to bottom, #16131f 0%, #25133f 55%, #3b1a6b 100%)",
      accent: "#e1ccff",
      ring: "#9F8AB2",
      artwork: "radial-gradient(circle at 30% 30%, #8a63c9, #2a1650 70%)",
      playButtonSvg: "/small-play-wave-button.svg",
      Icon: Waves,
    };
  }
  if (t.includes("water")) {
    return {
      key: "water",
      label: "Water",
      background: "linear-gradient(to bottom, #11191c 0%, #0c2c36 55%, #0f5a70 100%)",
      accent: "#c4f1fb",
      ring: "#7fd0e6",
      artwork: "radial-gradient(circle at 30% 30%, #6fcfe6, #135060 70%)",
      Icon: Droplets,
    };
  }
  return {
    key: "default",
    label: "Default",
    background: "linear-gradient(to bottom, #15161d 0%, #1d1f2b 55%, #2a2d3f 100%)",
    accent: "#dfe2f2",
    ring: "#9da3c2",
    artwork: "radial-gradient(circle at 30% 30%, #7b819c, #2a2d3f 70%)",
    Icon: AudioLines,
  };
}

