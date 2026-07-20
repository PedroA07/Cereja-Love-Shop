module.exports = {
  ...require('@cereja/config/eslint'),
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
};
