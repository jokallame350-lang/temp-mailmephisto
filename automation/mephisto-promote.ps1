<#
.SYNOPSIS
    MephistoMail Social Media Promotion Automation
.DESCRIPTION
    Automated promotion system for MephistoMail across X (Twitter), Reddit,
    Hacker News, Product Hunt, and IndieHackers.
.NOTES
    Usage: .\mephisto-promote.ps1 -Action <action> [options]
    Actions: tweet, reddit, competitors, log, status, all, schedule, next
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('tweet', 'reddit', 'competitors', 'log', 'status', 'all', 'schedule', 'next')]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [int]$TweetId = 0,

    [Parameter(Mandatory=$false)]
    [string]$RedditId = '',

    [Parameter(Mandatory=$false)]
    [int]$DelayMinutes = 5,

    [Parameter(Mandatory=$false)]
    [int]$Count = 1,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$QueueFile = Join-Path $ScriptDir 'tweet-queue.json'
$LogFile = Join-Path $ScriptDir 'post-log.json'
$SiteUrl = 'https://mephistomail.site'

function Write-Header {
    param($Text)
    Write-Host ''
    Write-Host ('=' * 60) -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 60) -ForegroundColor DarkCyan
}

function Write-Success {
    param($Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Info {
    param($Text)
    Write-Host "  [i] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param($Text)
    Write-Host "  [!] $Text" -ForegroundColor Red
}

function Get-QueueData {
    if (!(Test-Path $QueueFile)) {
        Write-Err 'tweet-queue.json bulunamadi!'
        exit 1
    }
    $raw = Get-Content $QueueFile -Raw -Encoding UTF8
    return $raw | ConvertFrom-Json
}

function Save-QueueData {
    param($Data)
    $Data | ConvertTo-Json -Depth 10 | Set-Content $QueueFile -Encoding UTF8
}

function Get-LogData {
    if (!(Test-Path $LogFile)) {
        $empty = @{
            posts = @()
            stats = @{
                totalPosts = 0
                platforms = @{
                    x = 0
                    reddit = 0
                    hackernews = 0
                    producthunt = 0
                    indiehackers = 0
                }
                lastPostDate = $null
                bestPerformingCategory = $null
            }
        }
        $empty | ConvertTo-Json -Depth 10 | Set-Content $LogFile -Encoding UTF8
        return $empty
    }
    $raw = Get-Content $LogFile -Raw -Encoding UTF8
    return $raw | ConvertFrom-Json
}

function Save-LogData {
    param($Data)
    $Data | ConvertTo-Json -Depth 10 | Set-Content $LogFile -Encoding UTF8
}

function Add-PostLog {
    param($Platform, $PostId, $Text, $Category, $Url)
    $log = Get-LogData
    if ($Text.Length -gt 80) {
        $shortText = $Text.Substring(0, 80) + '...'
    } else {
        $shortText = $Text
    }
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $postDate = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'
    $entry = @{
        id         = "$Platform-$PostId-$ts"
        platform   = $Platform
        postId     = $PostId
        text       = $shortText
        category   = $Category
        url        = $Url
        postedAt   = $postDate
        engagement = @{ likes = 0; retweets = 0; replies = 0; clicks = 0 }
        notes      = ''
    }
    $log.posts += $entry
    $log.stats.totalPosts++
    if ($log.stats.platforms.PSObject.Properties[$Platform]) {
        $log.stats.platforms.$Platform++
    }
    $log.stats.lastPostDate = $entry.postedAt
    Save-LogData $log
    return $entry
}

function Post-Tweet {
    param([int]$Id, [switch]$NoLog)

    $queue = Get-QueueData
    $tweet = $null

    if ($Id -gt 0) {
        $tweet = $queue.queue | Where-Object { $_.id -eq $Id }
        if (!$tweet) {
            Write-Err "Tweet ID $Id bulunamadi!"
            return $false
        }
    } else {
        $tweet = $queue.queue | Where-Object { $_.posted -eq $false } | Select-Object -First 1
        if (!$tweet) {
            Write-Err 'Kuyrukta paylasilacak tweet kalmadi!'
            return $false
        }
    }

    if ($tweet.posted) {
        Write-Info "Tweet #$($tweet.id) zaten paylasilmis ($($tweet.postedAt))"
        return $false
    }

    $text = $tweet.text
    $charCount = $text.Length
    $encoded = [System.Uri]::EscapeDataString($text)
    $intentUrl = "https://x.com/intent/post?text=$encoded"

    Write-Info "Tweet #$($tweet.id) [$($tweet.category)] ($charCount karakter)"
    Write-Host '  -----------------------------------------------' -ForegroundColor DarkGray
    $text -split "`n" | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host '  -----------------------------------------------' -ForegroundColor DarkGray

    if ($charCount -gt 280) {
        Write-Err "UYARI: Tweet $charCount karakter - limit 280! Kisaltmaniz gerekiyor."
        return $false
    }

    if ($DryRun) {
        Write-Info '[DRY RUN] Paylasim simulasyonu - tarayici acilmadi'
        return $true
    }

    Start-Process $intentUrl
    Write-Success "Tarayicida tweet compose acildi - 'Gonderi yayinla' butonuna tiklayin!"

    $confirm = Read-Host '  Paylasimi yaptiniz mi? (e/h)'
    if ($confirm -eq 'e' -or $confirm -eq 'E' -or $confirm -eq 'evet') {
        $tweet.posted = $true
        $tweet.postedAt = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'
        Save-QueueData $queue

        if (!$NoLog) {
            $logEntry = Add-PostLog -Platform 'x' -PostId $tweet.id -Text $tweet.text -Category $tweet.category -Url $intentUrl
            Write-Success "Post log'a kaydedildi: $($logEntry.id)"
        }
        return $true
    } else {
        Write-Info 'Paylasim iptal edildi.'
        return $false
    }
}

function Post-NextTweet {
    Write-Header 'SIRADAKI TWEET'
    Post-Tweet -Id 0
}

function Post-Reddit {
    param([string]$Id)

    $queue = Get-QueueData
    $post = $null

    if ($Id) {
        $post = $queue.reddit_posts | Where-Object { $_.id -eq $Id }
        if (!$post) {
            Write-Err "Reddit post ID '$Id' bulunamadi!"
            return $false
        }
    } else {
        $post = $queue.reddit_posts | Where-Object { $_.posted -eq $false } | Select-Object -First 1
        if (!$post) {
            Write-Err 'Kuyrukta paylasilacak Reddit postu kalmadi!'
            return $false
        }
    }

    if ($post.posted) {
        Write-Info "Reddit post $($post.id) zaten paylasilmis"
        return $false
    }

    $subreddit = $post.subreddit -replace '^r/', ''
    $title = [System.Uri]::EscapeDataString($post.title)
    $body = [System.Uri]::EscapeDataString($post.body)
    $redditUrl = "https://www.reddit.com/r/$subreddit/submit?type=text&title=$title&text=$body"

    Write-Info "Reddit: $($post.subreddit) - $($post.title)"
    Write-Host '  -----------------------------------------------' -ForegroundColor DarkGray
    $post.body -split "`n" | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host '  -----------------------------------------------' -ForegroundColor DarkGray

    if ($DryRun) {
        Write-Info '[DRY RUN] Reddit paylasim simulasyonu'
        return $true
    }

    Start-Process $redditUrl
    Write-Success 'Reddit submit sayfasi acildi - paylasim yapin!'

    $confirm = Read-Host '  Paylasimi yaptiniz mi? (e/h)'
    if ($confirm -eq 'e' -or $confirm -eq 'E' -or $confirm -eq 'evet') {
        $post.posted = $true
        $post.postedAt = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'
        Save-QueueData $queue
        $logEntry = Add-PostLog -Platform 'reddit' -PostId $post.id -Text "$($post.subreddit): $($post.title)" -Category 'reddit-post' -Url $redditUrl
        Write-Success "Post log'a kaydedildi: $($logEntry.id)"
        return $true
    } else {
        Write-Info 'Reddit paylasimi iptal edildi.'
        return $false
    }
}

function Post-AllReddit {
    Write-Header 'REDDIT PAYLASIM (TUM SUBREDDITLER)'
    $queue = Get-QueueData
    $pending = @($queue.reddit_posts | Where-Object { $_.posted -eq $false })

    if ($pending.Count -eq 0) {
        Write-Info 'Tum Reddit postlari zaten paylasilmis!'
        return
    }

    Write-Info "$($pending.Count) adet Reddit postu kuyrukta"

    foreach ($post in $pending) {
        Write-Host ''
        Post-Reddit -Id $post.id

        $currentIdx = [array]::IndexOf($pending, $post)
        if ($currentIdx -lt ($pending.Count - 1)) {
            Write-Info "Sonraki post icin $DelayMinutes dakika bekleniyor (spam onleme)..."
            if (!$DryRun) { Start-Sleep -Seconds ($DelayMinutes * 60) }
        }
    }
}

function Watch-Competitors {
    Write-Header 'RAKIP TAKIP (COMPETITOR MONITORING)'
    $queue = Get-QueueData

    if (!$queue.competitors) {
        Write-Err 'Rakip listesi bulunamadi!'
        return
    }

    Write-Info 'Takip edilen rakipler:'
    Write-Host ''

    foreach ($comp in $queue.competitors) {
        Write-Host "  - $($comp.name) ($($comp.x_handle)) [$($comp.type)]" -ForegroundColor White
    }

    Write-Host ''
    Write-Info 'Rakip sayfalarini acmak icin secim yapin:'
    Write-Host ''

    for ($i = 0; $i -lt $queue.competitors.Count; $i++) {
        Write-Host "  [$($i+1)] $($queue.competitors[$i].name) ($($queue.competitors[$i].x_handle))" -ForegroundColor Cyan
    }
    Write-Host '  [A] Hepsini ac' -ForegroundColor Yellow
    Write-Host '  [S] Mention/Search: MephistoMail hakkinda ne diyorlar?' -ForegroundColor Yellow
    Write-Host '  [Q] Cikis' -ForegroundColor DarkGray

    $choice = Read-Host "`n  Seciminiz"

    if ($choice -eq 'A' -or $choice -eq 'a') {
        foreach ($comp in $queue.competitors) {
            Start-Process $comp.url
            Start-Sleep -Milliseconds 800
        }
        Write-Success 'Tum rakip sayfalari acildi!'
    }
    elseif ($choice -eq 'S' -or $choice -eq 's') {
        $searchUrl = 'https://x.com/search?q=MephistoMail%20OR%20mephistomail.site&src=typed_query&f=live'
        Start-Process $searchUrl
        Write-Success 'MephistoMail mention aramasi acildi!'

        $searchUrl2 = 'https://x.com/search?q=%22temp%20mail%22%20OR%20%22disposable%20email%22%20-from%3Abenmxrt&src=typed_query&f=live'
        Start-Process $searchUrl2
        Write-Success 'Temp mail konusmalar aramasi acildi - reply firsatlari!'
    }
    elseif ($choice -eq 'Q' -or $choice -eq 'q') {
        return
    }
    else {
        $idx = [int]$choice - 1
        if ($idx -ge 0 -and $idx -lt $queue.competitors.Count) {
            Start-Process $queue.competitors[$idx].url
            Write-Success "$($queue.competitors[$idx].name) sayfasi acildi!"
        } else {
            Write-Err 'Gecersiz secim!'
        }
    }
}

function Show-Status {
    Write-Header 'DURUM RAPORU'

    $queue = Get-QueueData
    $totalTweets = @($queue.queue).Count
    $postedTweets = @($queue.queue | Where-Object { $_.posted -eq $true }).Count
    $pendingTweets = $totalTweets - $postedTweets

    $totalReddit = @($queue.reddit_posts).Count
    $postedReddit = @($queue.reddit_posts | Where-Object { $_.posted -eq $true }).Count
    $pendingReddit = $totalReddit - $postedReddit

    Write-Host ''
    Write-Host '  TWEET KUYRUGU' -ForegroundColor Cyan
    Write-Host "  |-- Toplam  : $totalTweets" -ForegroundColor White
    Write-Host "  |-- Atilmis : $postedTweets" -ForegroundColor Green
    Write-Host "  +-- Bekleyen: $pendingTweets" -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  REDDIT POSTLARI' -ForegroundColor Cyan
    Write-Host "  |-- Toplam  : $totalReddit" -ForegroundColor White
    Write-Host "  |-- Atilmis : $postedReddit" -ForegroundColor Green
    Write-Host "  +-- Bekleyen: $pendingReddit" -ForegroundColor Yellow

    $log = Get-LogData
    Write-Host ''
    Write-Host '  POST LOG' -ForegroundColor Cyan
    Write-Host "  |-- Toplam Post   : $($log.stats.totalPosts)" -ForegroundColor White
    Write-Host "  |-- X Posts       : $($log.stats.platforms.x)" -ForegroundColor White
    Write-Host "  |-- Reddit Posts  : $($log.stats.platforms.reddit)" -ForegroundColor White
    if ($log.stats.lastPostDate) {
        $lastDate = $log.stats.lastPostDate
    } else {
        $lastDate = 'Henuz yok'
    }
    Write-Host "  +-- Son Paylasim  : $lastDate" -ForegroundColor White

    if ($log.posts.Count -gt 0) {
        Write-Host ''
        Write-Host '  KATEGORI DAGILIMI' -ForegroundColor Cyan
        $categories = $log.posts | Group-Object -Property category | Sort-Object Count -Descending
        foreach ($cat in $categories) {
            $bar = '#' * $cat.Count
            Write-Host "  |-- $($cat.Name): $bar ($($cat.Count))" -ForegroundColor White
        }
    }

    $nextTweet = $queue.queue | Where-Object { $_.posted -eq $false } | Select-Object -First 1
    if ($nextTweet) {
        Write-Host ''
        Write-Host "  SIRADAKI TWEET (#$($nextTweet.id))" -ForegroundColor Magenta
        if ($nextTweet.text.Length -gt 100) {
            $preview = $nextTweet.text.Substring(0, 100) + '...'
        } else {
            $preview = $nextTweet.text
        }
        Write-Host "  $preview" -ForegroundColor DarkGray
    }
}

function Update-PostLog {
    Write-Header 'PERFORMANS GUNCELLEME'
    $log = Get-LogData

    if ($log.posts.Count -eq 0) {
        Write-Info 'Henuz hic post kaydedilmemis.'
        return
    }

    Write-Info 'Son 10 post:'
    $recentPosts = @($log.posts | Select-Object -Last 10)

    for ($i = 0; $i -lt $recentPosts.Count; $i++) {
        $p = $recentPosts[$i]
        Write-Host ''
        Write-Host "  [$($i+1)] $($p.id)" -ForegroundColor Cyan
        Write-Host "       Platform: $($p.platform) | Kategori: $($p.category)" -ForegroundColor DarkGray
        Write-Host "       $($p.text)" -ForegroundColor White
        Write-Host "       Likes: $($p.engagement.likes) | RT: $($p.engagement.retweets) | Replies: $($p.engagement.replies)" -ForegroundColor Yellow
    }

    $updateIdx = Read-Host "`n  Hangi postun metriklerini guncellemek istiyorsunuz? (numara veya q)"
    if ($updateIdx -eq 'q') { return }

    $idx = [int]$updateIdx - 1
    if ($idx -lt 0 -or $idx -ge $recentPosts.Count) {
        Write-Err 'Gecersiz secim!'
        return
    }

    $selectedPost = $recentPosts[$idx]
    $postIndex = [array]::IndexOf($log.posts, $selectedPost)

    $likes = Read-Host '  Likes'
    $rts = Read-Host '  Retweets/Shares'
    $replies = Read-Host '  Replies/Comments'
    $clicks = Read-Host '  Link clicks (biliniyorsa, yoksa 0)'
    $notes = Read-Host '  Notlar (bos birakilabilir)'

    $log.posts[$postIndex].engagement.likes = [int]$likes
    $log.posts[$postIndex].engagement.retweets = [int]$rts
    $log.posts[$postIndex].engagement.replies = [int]$replies
    $log.posts[$postIndex].engagement.clicks = [int]$clicks
    if ($notes) { $log.posts[$postIndex].notes = $notes }

    Save-LogData $log
    Write-Success 'Metrikler guncellendi!'
}

function Start-Schedule {
    Write-Header 'ZAMANLI PAYLASIM MODU'

    $queue = Get-QueueData
    $pending = @($queue.queue | Where-Object { $_.posted -eq $false })

    if ($pending.Count -eq 0) {
        Write-Info 'Kuyrukta bekleyen tweet yok!'
        return
    }

    Write-Info "Kuyrukta $($pending.Count) tweet var"
    Write-Info "Her tweet arasi $DelayMinutes dakika beklenecek"
    Write-Info "Toplam $Count tweet paylasilacak"
    Write-Host ''

    $posted = 0
    foreach ($tweet in $pending) {
        if ($posted -ge $Count) { break }

        Write-Header "TWEET $($posted + 1) / $Count"
        $result = Post-Tweet -Id $tweet.id

        if ($result) {
            $posted++
            if ($posted -lt $Count -and $posted -lt $pending.Count) {
                Write-Info "Sonraki tweet icin $DelayMinutes dakika bekleniyor..."
                if (!$DryRun) {
                    for ($i = $DelayMinutes; $i -gt 0; $i--) {
                        Write-Host "`r  Kalan sure: $i dakika...  " -NoNewline -ForegroundColor DarkYellow
                        Start-Sleep -Seconds 60
                    }
                    Write-Host ''
                }
            }
        }
    }

    Write-Header 'TAMAMLANDI'
    Write-Success "$posted / $Count tweet paylasildi!"
}

function Start-AllPlatforms {
    Write-Header 'TUM PLATFORMLAR - MEPHISTOMAIL TANITIM'
    Write-Host ''
    Write-Host '  [1] X (Twitter) - Siradaki tweeti at' -ForegroundColor Cyan
    Write-Host '  [2] Reddit - Tum subredditlerde paylas' -ForegroundColor Cyan
    Write-Host '  [3] Hacker News - Show HN postu ac' -ForegroundColor Cyan
    Write-Host '  [4] Product Hunt - Launch sayfasi ac' -ForegroundColor Cyan
    Write-Host '  [5] IndieHackers - Post sayfasi ac' -ForegroundColor Cyan
    Write-Host '  [A] Hepsini sirayla yap' -ForegroundColor Yellow
    Write-Host '  [Q] Cikis' -ForegroundColor DarkGray
    Write-Host ''

    $choice = Read-Host '  Seciminiz'

    switch ($choice) {
        '1' { Post-NextTweet }
        '2' { Post-AllReddit }
        '3' {
            $hnTitle = [System.Uri]::EscapeDataString('Show HN: MephistoMail - A RAM-only, tracker-free disposable email client')
            $hnSiteEncoded = [System.Uri]::EscapeDataString($SiteUrl)
            $hnUrl = "https://news.ycombinator.com/submitlink?u=$hnSiteEncoded&t=$hnTitle"
            Start-Process $hnUrl
            Write-Success 'Hacker News submit sayfasi acildi!'
            $confirm = Read-Host '  Paylasimi yaptiniz mi? (e/h)'
            if ($confirm -eq 'e') {
                Add-PostLog -Platform 'hackernews' -PostId 'show-hn' -Text 'Show HN: MephistoMail' -Category 'launch' -Url $hnUrl | Out-Null
                Write-Success "Log'a kaydedildi!"
            }
        }
        '4' {
            Start-Process 'https://www.producthunt.com/posts/new'
            Write-Success 'Product Hunt submit sayfasi acildi!'
            Write-Info 'launch_materials.md dosyasindaki icerik kullanilabilir.'
        }
        '5' {
            Start-Process 'https://www.indiehackers.com/new-post'
            Write-Success 'IndieHackers post sayfasi acildi!'
            Write-Info 'launch_materials.md dosyasindaki icerik kullanilabilir.'
        }
        'A' {
            Post-NextTweet
            Write-Info 'Reddit postlarina geciliyor (5 dk bekleme)...'
            if (!$DryRun) { Start-Sleep -Seconds 300 }
            Post-AllReddit
        }
        'Q' { return }
        default { Write-Err 'Gecersiz secim!' }
    }
}

# MAIN
Write-Host ''
Write-Host '  ================================================' -ForegroundColor Red
Write-Host '  |     MEPHISTOMAIL PROMOTION ENGINE v1.0        |' -ForegroundColor Red
Write-Host '  |     Social Media Automation Suite              |' -ForegroundColor DarkRed
Write-Host '  ================================================' -ForegroundColor Red

switch ($Action) {
    'tweet'       { Write-Header 'TWEET PAYLASIMI'; Post-Tweet -Id $TweetId }
    'next'        { Post-NextTweet }
    'reddit'      { if ($RedditId) { Post-Reddit -Id $RedditId } else { Post-AllReddit } }
    'competitors' { Watch-Competitors }
    'log'         { Update-PostLog }
    'status'      { Show-Status }
    'all'         { Start-AllPlatforms }
    'schedule'    { Start-Schedule }
}

Write-Host ''
