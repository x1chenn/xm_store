$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$taskProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskSourceDir = Join-Path $taskProjectRoot 'assets\images'
$taskOutputDir = Join-Path $taskProjectRoot 'miniprogram\assets\images'
New-Item -ItemType Directory -Path $taskOutputDir -Force | Out-Null
$taskEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$taskEncoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$taskEncoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]64)
foreach ($taskImageFile in Get-ChildItem -LiteralPath $taskSourceDir -Filter '*.jpg') {
    $taskSourceImage = [System.Drawing.Image]::FromFile($taskImageFile.FullName)
    $taskScale = [Math]::Min([double]1, [double]750 / $taskSourceImage.Width)
    $taskWidth = [int][Math]::Round($taskSourceImage.Width * $taskScale)
    $taskHeight = [int][Math]::Round($taskSourceImage.Height * $taskScale)
    $taskBitmap = New-Object System.Drawing.Bitmap($taskWidth, $taskHeight)
    $taskGraphics = [System.Drawing.Graphics]::FromImage($taskBitmap)
    try {
        $taskGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $taskGraphics.DrawImage($taskSourceImage, 0, 0, $taskWidth, $taskHeight)
        $taskBitmap.Save((Join-Path $taskOutputDir $taskImageFile.Name), $taskEncoder, $taskEncoderParameters)
    } finally {
        $taskGraphics.Dispose()
        $taskBitmap.Dispose()
        $taskSourceImage.Dispose()
    }
}
$taskEncoderParameters.Dispose()
$taskOutputSummary = Get-ChildItem -LiteralPath $taskOutputDir -Filter '*.jpg' | Measure-Object -Property Length -Sum
Write-Output "Packaged $($taskOutputSummary.Count) local images: $($taskOutputSummary.Sum) bytes. Original website photos are unchanged."
