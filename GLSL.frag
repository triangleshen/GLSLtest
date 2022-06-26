// Author: CMH
// Title: Learning Shaders


#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;



float hash1(vec2 p)         //亂數範圍 [0,1]
{
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return fract( p.x*p.y*(p.x+p.y) );
}

float vnoise( in vec2 p )       //亂數範圍 [0,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix(mix( hash1( i + vec2(0.0,0.0) ), 
                              hash1( i + vec2(1.0,0.0) ), u.x),
                     mix( hash1( i + vec2(0.0,1.0) ), 
                              hash1( i + vec2(1.0,1.0) ), u.x), u.y);
}


vec2 hash2( vec2 x ) //亂數範圍 [-1,1] 
{
 const vec2 k = vec2( 0.3183099, 0.3678794 );
 x = x*k + k.yx;
 return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p ) //亂數範圍 [-1,1]
{
 vec2 i = floor( p );
 vec2 f = fract( p );
 vec2 u = f*f*(3.0-2.0*f);
 return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
 dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
 mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
 dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(in vec2 uv) //亂數範圍 [-1,1] //旋轉亂數，棉絮感
{
float f;
//fbm - fractal noise (4 octaves)
mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
f = 0.5000*gnoise( 1.0*uv );
f += 0.2500*gnoise( 2.0*uv );
f += 0.1250*gnoise( 4.0*uv );
f += 0.0625*gnoise( 8.0*uv );
return f;
}

//————————————————————————————————

void main()
{
    vec2 uv= gl_FragCoord.xy/u_resolution.xy;
	
	
	
	//clouds
	vec3 color = vec3(1.0);
    color = texture2D(u_tex1, uv).rgb;
	
	float x= fbm(3.0*uv+0.3*u_time)*0.5+0.5;
    vec3 cloud=mix(color,vec3(0.2,0.08,0.04),x);
	vec4 cloudF = vec4(cloud,1.0);
	
	
	
	//網點效果
    float frequency = 80.0; 
	// Needed globally for lame version of aastep()
	float y= fbm(3.0*uv+0.1*u_time)*0.5+0.5;
    frequency = mix(200.0, 300.0, y);
    // Distance to nearest point in a grid of points over the unit square
    vec2 st=uv;
    vec2 st2 = mat2(0.707, -0.707, 0.707, 0.707) * st;
    vec2 nearest = 2.0*fract(frequency * st2) - 1.0;
    float dist = length(nearest);
    // Use a texture to modulate the size of the dots
    vec3 texcolor = texture2D(u_tex1, st).rgb; // Unrotated coords
    float radius = sqrt(1.0-texcolor.g); // Use green channel
    
    //選項一，自建noise函數
    float n = 0.1*vnoise(st*200.0); // Fractal noise
    n += 0.05*vnoise(st*400.0);
    n += 0.025*vnoise(st*800.0);
    
    vec3 white = vec3(0.98+n);
    vec3 black = vec3(0.5,0.1,0.1);
    vec3 fragcolor = mix(black, white, smoothstep(radius*0.9, radius*1.3, dist+n));
    //gl_FragColor = vec4(fragcolor, 1.0);
    //Multiply color by texture
    //gl_FragColor = vec4(fragcolor, 1.0)*texture2D(u_tex1, st) ;
	
	vec4 colorMix = vec4(fragcolor, 1.0)*cloudF;
	
	
	//offset
	vec2 offset[9];
	float step_w = (1.0)/u_resolution.x;
	float step_h = (1.0)/u_resolution.y;
	offset[0]=vec2(-step_w, -step_h);
	offset[1]=vec2(	   0.0, -step_h);
	offset[2]=vec2(	step_w, -step_h);
	offset[3]=vec2(-step_w, 0.0);
	offset[4]=vec2(	   0.0, 0.0);
	offset[5]=vec2(	step_w, 0.0);
	offset[6]=vec2(-step_w, step_h);
	offset[7]=vec2(	   0.0, step_h);
	offset[8]=vec2(	step_w, step_h);

	//Outline
	float amp=1.0;
	vec4 sum = vec4(0.0);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[0]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[1]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[2]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[3]);
	sum += ( 8.0*amp)*texture2D(u_tex1, st+offset[4]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[5]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[6]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[7]);
	sum += (-1.0*amp)*texture2D(u_tex1, st+offset[8]);

	float luma=1.0*sum.r + 0.0*sum.g + 0.0*sum.b;
    vec4 grayColor = vec4(luma, 0.0, 0.0, 1.0);
    vec4 coloroutline = mix(sum, grayColor, 0.5*amp);
	
	
	//BLUR
	vec4 sumA = vec4(0.0);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[0]); //讀圖檔所以st是二維的
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[1]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[2]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[3]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[4]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[5]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[6]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[7]);
	sumA += (1.0*amp)*texture2D(u_tex1, st+offset[8]);
	sumA /= 54.0; //避免過度曝光所以要全部除以9
	
	float luma2=1.0*sumA.r+0.0*sumA.g+0.0*sumA.b;
	vec4 graycolorA=vec4(luma2*2.0,luma2*1.2,luma2*1.2,1.0);
	
	
	vec4 xyz = vec4(sin(1.0*u_time)*0.5+0.5);
	vec4 colormixn= mix(coloroutline,graycolorA,xyz);
	
	
	
	vec4 z = vec4(u_mouse.y/u_resolution.y);
	gl_FragColor = mix(colormixn,colorMix,z) ;
	

}

