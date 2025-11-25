name: Download NameJet Deleting List

on:
  schedule:
    - cron: '0 0 */5 * *'  # every 5 days at midnight UTC
  workflow_dispatch:

permissions:
  contents: write

jobs:
  fetch-namejet:
    runs-on: ubuntu-latest
    env:
      NAMEJET_USERNAME: ${{ secrets.NAMEJET_USERNAME }}
      NAMEJET_PASSWORD: ${{ secrets.NAMEJET_PASSWORD }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install axios jsdom qs

      - name: Run download script
        run: node download.js

      - name: Archive the CSV with date
        run: |
          mkdir -p archive
          DATE=$(date +'%Y-%m-%d')
          cp deletinglist.csv "archive/deletinglist-$DATE.csv"

      - name: Commit & push
        run: |
          git config --global user.name "DEVBLTOOLS"
          git config --global user.email "bitlabtools@gmail.com"
          git add deletinglist.csv archive/
          if git diff --staged --quiet; then
            echo "No changes"
          else
            git commit -m "Update NameJet list $DATE"
            git push
          fi
