# Podcast Oasis Playlist Skipper

## Overview
このプログラムは、ポッドキャストオアシスのプレイリストを流す際に、特定の時間になったら次の曲にスキップするためのプログラムです。  

ポッドキャストオアシスとは、ポッドキャスターとリスナーのつどいです。  
詳しくは [公式サイト](https://podcast-oasis.studio.site/) をご覧ください。  

## Initial Setup

### Create .env file
```shell
cp .env.example .env
```

### Edit .env file
```
SPOTIFY_USERNAME="YOUR_SPOTIFY_USERNAME"
SPOTIFY_PASSWORD="YOUR_SPOTIFY_PASSWORD"
SPOTIFY_PLAYLIST_URL="https://open.spotify.com/playlist/YOUR_PLAYLIST_ID"
EPISODE_INTERVAL_MILLISECONDS="380000" # 好きなミリ秒を設定してください。この値は6分20秒です。
```

### Install packages
```shell
npm ci
```

## How to use

まず、プログラムを実行します。

```shell
npm start
```

実行すると自動でブラウザが立ち上がります。（Puppeteer を利用しています。）  
その後、自動的に .env に設定した情報をもとに、プレイリストにアクセスして Spotify にログインします。  
  

次に、別のブラウザや Spotify アプリなどで、ポッドキャストオアシスのプレイリストを再生します。  
（立ち上がったブラウザから再生するとうまくエピソードを再生できないので注意が必要です。）  
自動スキップの機能は、プレイリストが再生されるまで実行されません。  

プレイリストが再生されると、.env に設定した時間ごとに次の曲にスキップします。  
設定する値はミリ秒なので注意してください。1秒ごとにしたい場合は、1000を設定することになります。  

仮に、設定した時間よりも短いエピソードを再生した場合は、次のエピソードに移行したタイミングでタイマーがリセットされるようになっています。  
手動でエピソードをスキップした場合も同様です。タイマーがずれることはありません。  

また、このプログラムにはスキップ機能を停止する機能がありません。もし終了したい場合は、ctrl + c でプログラムを終了してください。

