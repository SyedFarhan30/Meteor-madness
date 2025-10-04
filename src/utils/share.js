export async function shareScenario(text, url){
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      return true;
    }
  } catch {}
  // fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Link copied to clipboard.");
  } catch {
    alert("Sharing not supported.");
  }
  return false;
}
