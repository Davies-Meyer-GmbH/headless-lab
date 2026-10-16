import { withCanvas } from '@drupal-canvas/headless-next/config';

export default withCanvas({
  webpack(config, { dev, isServer, webpack }) {
    if (dev && !isServer) {
      // The App Router extracts CSS in development. Emit a CSS map as well
      // as Next's default JavaScript maps so DevTools can follow Sass partials.
      config.plugins.push(
        new webpack.SourceMapDevToolPlugin({
          test: /\.css$/,
          filename: '[file].map',
        }),
      );
    }
    return config;
  },
});
