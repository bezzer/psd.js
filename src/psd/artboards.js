export function getArtboardDetails(psd) {
  return psd
    .tree()
    .children()
    .filter(layer => Boolean(layer.layer.adjustments.artboard))
    .map(artboard => {
      const name = artboard.layer.adjustments.name.data;
      const { artboardRect } = artboard.layer.adjustments.artboard.data;
      const left =  artboardRect.Left;
      const top =  artboardRect['Top '];
      const right =  artboardRect.Rght;
      const bottom =  artboardRect.Btom;

      const width = right - left;
      const height = bottom - top;

      return { name, width, height, top, left };
    });
}
