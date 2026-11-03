import urllib.request
import re

# Aapke diye gaye saare playlist URLs ki list
playlist_urls = [
    "https://raw.githubusercontent.com/Prtstream820894/Prmovies-south-movies/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Bollywood-movies/raw/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/Prmovies-action-movies/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/comdey-movies/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/Crime-movies/refs/heads/main/playlist.m3u",
    "https://github.com/Prtstream820894/Drama-movies/raw/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/Mystery-movies/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/War-movies/refs/heads/main/playlist.m3u",
    "https://github.com/Prtstream820894/Family-movies-prmovies/raw/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/Fantasy-movies/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Horror-movies-/raw/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/History-movies-/raw/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Romances-movie/raw/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/PRTSTREAM/Advantures-movies/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Thriller-movie/raw/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Science-fiction-movie-/raw/refs/heads/main/playlist.m3u",
    "https://raw.githubusercontent.com/Prtstream820894/Prmovies-hollywood-/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Web-series-all/raw/refs/heads/main/playlist.m3u",
    "https://github.com/PRTSTREAM/Hot-movies/raw/refs/heads/main/playlist.m3u"
]

def merge_m3u():
    merged_items = []
    
    for url in playlist_urls:
        try:
            print(f"Fetching: {url}")
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode('utf-8', errors='ignore')
                
                # M3U content ko lines mein split karein aur #EXTM3U header ko hata dein
                lines = content.splitlines()
                current_entry = []
                
                for line in lines:
                    line_str = line.strip()
                    if not line_str or line_str.startswith('#EXTM3U'):
                        continue
                    
                    if line_str.startswith('#EXTINF:'):
                        if current_entry:
                            merged_items.append("\n".join(current_entry))
                            current_entry = []
                        current_entry.append(line_str)
                    elif current_entry and not line_str.startswith('#'):
                        current_entry.append(line_str)
                        merged_items.append("\n".join(current_entry))
                        current_entry = []
                        
                if current_entry:
                    merged_items.append("\n".join(current_entry))
                    
        except Exception as e:
            print(f"Error fetching {url}: {e}")

    # Final playlist file write karein
    final_content = "#EXTM3U\n" + "\n".join(merged_items) + "\n"
    
    with open("playlist.m3u", "w", encoding="utf-8") as f:
        f.write(final_content)
    
    print("Playlist merged successfully as playlist.m3u!")

if __name__ == "__main__":
    merge_m3u()
