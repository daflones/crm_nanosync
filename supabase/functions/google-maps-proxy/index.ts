import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
}

serve(async (req) => {
  console.log(`Received ${req.method} request to google-maps-proxy`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('Processing request body...')
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { action, query, place_id, fields, key } = body

    if (!key) {
      throw new Error('API key é obrigatória')
    }

    let url: string
    
    if (action === 'search') {
      if (!query) {
        throw new Error('Query é obrigatória para busca')
      }
      // Google Places Text Search API
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`
    } else if (action === 'details') {
      if (!place_id) {
        throw new Error('place_id é obrigatório para detalhes')
      }
      // Google Places Details API
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields || 'name,formatted_phone_number'}&key=${key}`
    } else {
      throw new Error('Ação inválida. Use "search" ou "details"')
    }

    console.log(`Fazendo requisição para Google Maps: ${url.replace(key, 'HIDDEN_KEY')}`)

    const response = await fetch(url)
    const data = await response.json()

    console.log(`Google Maps response status: ${response.status}`)
    console.log(`Google Maps data status: ${data.status}`)

    if (!response.ok) {
      console.error('Google Maps API HTTP Error:', response.status, data)
      throw new Error(`Google Maps API HTTP Error: ${response.status}`)
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Maps API Status Error:', data.status, data.error_message)
      throw new Error(`Google Maps API Status: ${data.status} - ${data.error_message || 'Erro desconhecido'}`)
    }

    console.log('Returning successful response')
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Erro no proxy Google Maps:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
