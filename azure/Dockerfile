# Production Dockerfile for Mariano's Azure Scraper Job
FROM python:3.11-slim-bookworm

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies for headless Playwright and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
RUN pip install --no-cache-dir \
    playwright==1.42.0 \
    azure-storage-blob==12.19.0 \
    requests==2.31.0 \
    beautifulsoup4==4.12.3

# Install Playwright browser binary
RUN playwright install chromium --with-deps

# Copy application files
COPY scraper/ /app/scraper/
COPY azure/storage_promoter.py /app/azure/storage_promoter.py
COPY Marianos_Category_URLs.csv /app/Marianos_Category_URLs.csv

# Default entrypoint for Azure Container Apps Job
CMD ["python", "-m", "scraper.marianos_scraper"]
