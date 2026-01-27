default:
  @just --unsorted --list

# Run development server
dev:
    npm run dev

# Build the project with TypeScript compilation and Vite
build:
    npm run build

# Run ESLint on the codebase
lint:
    npm run lint

# Preview the production build
preview:
    npm run preview

# Deploy to Deno deploy
deploy:
    npm run build
    npm run deploy

# Deploy to Deno deploy production
deploy-prod:
    npm run build
    npm run deploy-prod
