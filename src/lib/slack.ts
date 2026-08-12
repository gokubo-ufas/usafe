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

export async function postSlackAlert(params: {
  type: 'test' | 'production'
  comment: string | null
  issuedAt: Date
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  if (!token) {
    console.error('[postSlackAlert] SLACK_BOT_TOKEN is not configured')
    return { ok: false, error: 'SLACK_BOT_TOKEN not configured' }
  }

  if (!channelId) {
    console.error('[postSlackAlert] SLACK_CHANNEL_ID is not configured')
    return { ok: false, error: 'SLACK_CHANNEL_ID not configured' }
  }

  const isProduction = params.type === 'production'

  const headerText = isProduction
    ? '【U-Safe｜安否確認】'
    : '【U-Safe｜安否確認訓練】'

  const bodyText = isProduction
    ? `安否確認が発報されました。

ご自身とご家族の安全を最優先してください。

ご家族の安否が確認できていない場合は、業務よりもご家族の安否確認を優先してください。

安全を確保したうえで、U-Safeから安否確認への回答をお願いします。

周囲に本チャンネルへ参加していない社員がいる場合は、安否確認が発報されていることをお伝えください。`
    : `これは安否確認訓練です。

U-Safeで安否確認への回答をお願いします。

災害時は、業務よりも本人と家族の安全を最優先してください。

周囲に本チャンネルへ参加していない社員がいる場合は、安否確認が発報されていることをお伝えください。`

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

  const blocks: Block[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: headerText },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: bodyText },
    },
  ]

  if (params.comment) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*補足：*\n${params.comment}` },
    })
  }

  const actionBlock: Block = {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'U-Safeを開く' },
        url: siteUrl,
        ...(isProduction ? { style: 'danger' as const } : {}),
      },
    ],
  }
  blocks.push(actionBlock)

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `発報日時：${formatJST(params.issuedAt)}` },
    ],
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
      body: JSON.stringify({
        channel: channelId,
        blocks,
      }),
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
