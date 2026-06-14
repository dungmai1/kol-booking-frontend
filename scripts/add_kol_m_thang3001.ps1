# Add KOL @m.thang3001 to KOL Hub via API
$ErrorActionPreference = 'Stop'
$BaseUrl = if ($env:API_URL) { $env:API_URL } else { 'https://kol-booking-backend.onrender.com/api/v1' }

$KolEmail = 'm.thang3001@seed.local'
$KolPassword = 'password123'
$AdminEmail = 'admin@dev.local'
$AdminPassword = 'password123'

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = $null
    )
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    $uri = "$BaseUrl$Path"
    if ($Body) {
        $json = $Body | ConvertTo-Json -Depth 10 -Compress
        return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $json
    }
    return Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
}

Write-Host "==> Dang ky / dang nhap KOL..."
try {
    $reg = Invoke-Api -Method POST -Path '/auth/register' -Body @{
        email    = $KolEmail
        password = $KolPassword
        role     = 'KOL'
    }
    $kolToken = $reg.data.accessToken
    Write-Host "    Da tao tai khoan moi."
} catch {
    $login = Invoke-Api -Method POST -Path '/auth/login' -Body @{
        email    = $KolEmail
        password = $KolPassword
    }
    $kolToken = $login.data.accessToken
    Write-Host "    Tai khoan da ton tai, da dang nhap."
}

Write-Host "==> Cap nhat ho so KOL..."
Invoke-Api -Method PUT -Path '/kols/me' -Token $kolToken -Body @{
    displayName = 'Koi'
    slug        = 'm-thang3001'
    bio         = 'TikToker chia se noi dung gym, fitness, push-up va vlog doi song. Kenh TikTok @m.thang3001.'
    gender      = 'MALE'
    city        = 'Ha Noi'
    country     = 'VN'
    categoryIds = @(7, 5)  # fitness=7, lifestyle=5 — se override neu backend khac
} | Out-Null

Write-Host "==> Them kenh TikTok..."
$channels = Invoke-Api -Method GET -Path '/kols/me/channels' -Token $kolToken
$existing = $channels.data | Where-Object { $_.platform -eq 'TIKTOK' -and $_.username -eq 'm.thang3001' }
if (-not $existing) {
    Invoke-Api -Method POST -Path '/kols/me/channels' -Token $kolToken -Body @{
        platform       = 'TIKTOK'
        url            = 'https://www.tiktok.com/@m.thang3001'
        username       = 'm.thang3001'
        followerCount  = 1235
        engagementRate = 5.0
        verified       = $false
    } | Out-Null
}

Write-Host "==> Them goi gia..."
$packages = Invoke-Api -Method GET -Path '/kols/me/packages' -Token $kolToken
if (-not ($packages.data | Where-Object { $_.platform -eq 'TIKTOK' -and $_.type -eq 'VIDEO' })) {
    Invoke-Api -Method POST -Path '/kols/me/packages' -Token $kolToken -Body @{
        type        = 'VIDEO'
        platform    = 'TIKTOK'
        price       = 3000000
        description = '1 video TikTok 30-60 giay, quay va dang tren kenh @m.thang3001'
    } | Out-Null
}

Write-Host "==> Them portfolio..."
$portfolio = Invoke-Api -Method GET -Path '/kols/me/portfolio' -Token $kolToken
if (-not ($portfolio.data | Where-Object { $_.mediaUrl -like '*m.thang3001*' })) {
    Invoke-Api -Method POST -Path '/kols/me/portfolio' -Token $kolToken -Body @{
        title        = 'Day 11 Hoan thanh - 30 ngay thay doi ban than'
        mediaUrl     = 'https://www.tiktok.com/@m.thang3001/video/7631296449514769684'
        mediaType    = 'VIDEO'
        campaignName = 'Fitness vlog'
    } | Out-Null
}

Write-Host "==> Gui duyet ho so..."
$profile = Invoke-Api -Method POST -Path '/kols/me/submit' -Token $kolToken
$profileId = $profile.data.id
Write-Host "    Profile ID: $profileId, Status: $($profile.data.status)"

Write-Host "==> Admin duyet ho so..."
$admin = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email    = $AdminEmail
    password = $AdminPassword
}
$adminToken = $admin.data.accessToken
Invoke-Api -Method POST -Path "/admin/kols/$profileId/approve" -Token $adminToken | Out-Null

$public = Invoke-Api -Method GET -Path '/kols/m-thang3001'
Write-Host ""
Write-Host "THANH CONG!"
Write-Host "  Ho so cong khai: /kol/m-thang3001"
Write-Host "  Ten: $($public.data.displayName)"
Write-Host "  TikTok: https://www.tiktok.com/@m.thang3001"
Write-Host "  Dang nhap KOL: $KolEmail / $KolPassword"
