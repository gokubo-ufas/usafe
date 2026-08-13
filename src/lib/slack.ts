function formatJST(date: Date): string {
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// P2P地震情報の震度整数値 → 表示文字列
function formatIntensity(intensity: number): string {
  const map: Record<number, string> = {
    10: '1',
    20: '2',
    30: '3',
    40: '4',
    45: '5弱',
    50: '5強',
    55: '6弱',
    60: '6強',
    70: '7',
  }
  return map[intensity] ?? String(intensity)
}

type Block =
  | { type: 'header'; text: { type: 'plain_text'; text: string } }
  | { type: 'section'; text: { type: 'mrkdwn'; text: string } }
  | {
      type: 'actions'
      elements: Array<{
        type: 'button'
        text: { type: 'plain_text'; text: string }
        url: string
        style?: 'danger' | 'primary'
      }>
    }
  | { type: 'context'; elements: Array<{ type: 'mrkdwn'; text: string }> }

export type SlackAlertParams =
  | {
      type: 'test'
      comment: string | null
      issuedAt: Date
    }
  | {
      type: 'earthquake'
      comment: string | null
      issuedAt: Date
      // 自動発報時のみ設定。手動発報時は null
      maxIntensity?: number | null
      epicenter?: string | null
    }

export async function postSlackAlert(
  params: SlackAlertParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token     = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  if (!token) {
    console.error('[postSlackAlert] SLACK_BOT_TOKEN is not configured')
    return { ok: false, error: 'SLACK_BOT_TOKEN not configured' }
  }
  if (!channelId) {
    console.error('[postSlackAlert] SLACK_CHANNEL_ID is not configured')
    return { ok: false, error: 'SLACK_CHANNEL_ID not configured' }
  }

  const blocks: Block[] = []

  if (params.type === 'test') {
    // ── 訓練発報 ──────────────────────────────────────────────
    blocks.push(
      { type: 'header', text: { type: 'plain_text', text: '【U-Safe｜安否確認訓練】' } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            'これは安否確認訓練です。',
            '',
            'U-Safeで安否確認への回答をお願いします。',
            '',
            '災害時は、業務よりも本人と家族の安全を最優先してください。',
            '',
            '周囲に本チャンネルへ参加していない社員がいる場合は、安否確認が発報されていることをお伝えください。',
          ].join('\n'),
        },
      },
    )
    if (params.comment) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*補足：*\n${params.comment}` } })
    }
    blocks.push({
      type: 'actions',
      elements: [{ type: 'button', text: { type: 'plain_text', text: 'U-Safeを開く' }, url: siteUrl }],
    })
  } else {
    // ── 本番発報（手動 or 自動） ───────────────────────────────
    const hasEqInfo = params.type === 'earthquake' &&
      params.maxIntensity != null

    const leadText = hasEqInfo
      ? [
          `最大震度${formatIntensity(params.maxIntensity!)}の地震が発生しました。`,
          `震源地：${params.epicenter ?? '不明'}`,
        ].join('\n')
      : '安否確認が発報されました。'

    blocks.push(
      { type: 'header', text: { type: 'plain_text', text: '【U-Safe｜安否確認】' } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            leadText,
            '',
            'ご自身とご家族の安全を最優先してください。',
            '',
            'ご家族の安否が確認できていない場合は、\n業務よりもご家族の安否確認を優先してください。',
            '',
            '安全を確保したうえで、\nU-Safeから安否確認への回答をお願いします。',
            '',
            '周囲に本チャンネルへ参加していない社員がいる場合は、\n安否確認が発報されていることをお伝えください。',
          ].join('\n'),
        },
      },
    )
    if (params.comment) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*補足：*\n${params.comment}` } })
    }
    blocks.push({
      type: 'actions',
      elements: [{ type: 'button', text: { type: 'plain_text', text: 'U-Safeを開く' }, url: siteUrl, style: 'danger' }],
    })
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `発報日時：${formatJST(params.issuedAt)}` }],
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: channelId, blocks }),
    })

    if (res.status === 429) {
      console.error('[postSlackAlert] rate_limited')
      return { ok: false, error: 'rate_limited' }
    }

    const json = (await res.json()) as { ok: boolean; error?: string }
    if (!json.ok) {
      console.error('[postSlackAlert] Slack API error:', json.error)
      return { ok: false, error: json.error ?? 'unknown_error' }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[postSlackAlert] network error:', message)
    return { ok: false, error: 'network_error' }
  } finally {
    clearTimeout(timeoutId)
  }
}
