import pg from 'pg';
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:true}:undefined,max:10});
export const q=(sql,params=[])=>pool.query(sql,params);
export async function init(){await q(`CREATE TABLE IF NOT EXISTS admins(id TEXT PRIMARY KEY,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(id UUID PRIMARY KEY,title TEXT NOT NULL,url TEXT,source_key TEXT,source_name TEXT,source_bytes BIGINT DEFAULT 0,status TEXT NOT NULL DEFAULT 'queued',progress REAL DEFAULT 0,phase TEXT, error TEXT, duration DOUBLE PRECISION,part_total INT DEFAULT 0,part_done INT DEFAULT 0,cancel_requested BOOLEAN DEFAULT false,attempts INT DEFAULT 0,lease_until TIMESTAMPTZ,created_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status,created_at);
CREATE TABLE IF NOT EXISTS parts(id UUID PRIMARY KEY,job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,part_no INT NOT NULL,object_key TEXT NOT NULL,bytes BIGINT NOT NULL DEFAULT 0,created_at TIMESTAMPTZ DEFAULT now(),UNIQUE(job_id,part_no));`)}
