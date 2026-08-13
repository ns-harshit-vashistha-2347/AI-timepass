FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.in .

RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.in

COPY . .

EXPOSE 8080
