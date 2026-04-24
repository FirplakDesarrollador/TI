const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://jdtjtkncptwqdhlxmzds.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGp0a25jcHR3cWRobHhtemRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTExODQwMDAsImV4cCI6MjAwNjc2MDAwMH0.CKSoqx81iXamo3ftitaQwOiyJ3OsIOMO8xlxwEBp5oE'
)

async function test() {
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('Error listing buckets:', error)
    } else {
      console.log('Buckets found:', data.map(b => b.name))
    }
  } catch (e) {
    console.error('Catch error:', e)
  }
}

test()
