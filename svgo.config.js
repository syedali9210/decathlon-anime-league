// Layers are inlined into one document, so ids must stay globally unique.
// Figma's exported ids already are; minifying them to a/b/c is what breaks
// mask and clipPath references across layers.
export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    { name: 'preset-default', params: { overrides: { cleanupIds: false } } },
  ],
}
