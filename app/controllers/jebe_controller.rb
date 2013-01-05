class JebeController < ApplicationController
	
  def index
  end

  def simulator
  	file = File.dirname($0) + '../../template/setting.html'
    @setting = IO.read(file)
    file = File.dirname($0) + '../../template/runtime.html'
    @runtime = IO.read(file)
    @runtime.gsub! /\n/, ''
    @runtime.gsub! /\//, '\\/'
    respond_to do |format|
      format.html
    end
  end

  def runtime
  end

  def preview
  end

  def upload
  	require 'fileutils'
    tmp = params[:pic].tempfile
    file = File.join('public/files', params[:pic].original_filename)
    FileUtils.cp tmp.path, file
    render :json => {files: ['/files/'+params[:pic].original_filename]}
  end

end

  